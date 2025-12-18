-- Invites + one-time bonus credits (viral referrals)
--
-- Goals:
-- - Gate new users behind an invite code
-- - When a user signs up via invite, grant 1,000 one-time bonus credits (items)
-- - Bonus credits are consumed only when exceeding monthly plan limit
-- - Existing users are grandfathered in via a system bootstrap redemption

-- 1) Invites
create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  kind text not null default 'user' check (kind in ('user','system')),
  created_by uuid,
  created_at timestamptz not null default now()
);

create unique index if not exists invites_code_unique on public.invites (lower(code));
create index if not exists invites_created_by_idx on public.invites (created_by);

-- 2) Redemptions
create table if not exists public.invite_redemptions (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid not null references public.invites(id) on delete restrict,
  invited_user_id uuid not null,
  inviter_user_id uuid,
  redeemed_at timestamptz not null default now()
);

create unique index if not exists invite_redemptions_invited_user_unique on public.invite_redemptions (invited_user_id);
create index if not exists invite_redemptions_inviter_user_idx on public.invite_redemptions (inviter_user_id);
create index if not exists invite_redemptions_invite_id_idx on public.invite_redemptions (invite_id);

-- 3) Bonus credit tracking (items)
create table if not exists public.bonus_credits_balance (
  org_id uuid primary key references public.organizations(id) on delete cascade,
  remaining_items bigint not null default 0 check (remaining_items >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.bonus_credits_grants (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  grant_type text not null,
  amount_items bigint not null check (amount_items > 0),
  source_invite_id uuid references public.invites(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (org_id, grant_type)
);

-- 4) RLS + grants (clients should not be able to mint credits)
alter table public.invites enable row level security;
alter table public.invite_redemptions enable row level security;
alter table public.bonus_credits_balance enable row level security;
alter table public.bonus_credits_grants enable row level security;

-- Read-only visibility for the current user.
-- Invites: creator can read their own invite codes.
drop policy if exists invites_select_own on public.invites;
create policy invites_select_own
on public.invites
for select
to authenticated
using (created_by = auth.uid());

-- Redemptions: the invited user can read their redemption; inviter can read referrals.
drop policy if exists invite_redemptions_select_self_or_inviter on public.invite_redemptions;
create policy invite_redemptions_select_self_or_inviter
on public.invite_redemptions
for select
to authenticated
using (invited_user_id = auth.uid() or inviter_user_id = auth.uid());

-- Bonus: org members can read their own balances/grants.
-- (Personal org == auth.uid(); keep it simple.)
drop policy if exists bonus_balance_select_self on public.bonus_credits_balance;
create policy bonus_balance_select_self
on public.bonus_credits_balance
for select
to authenticated
using (org_id = auth.uid());

drop policy if exists bonus_grants_select_self on public.bonus_credits_grants;
create policy bonus_grants_select_self
on public.bonus_credits_grants
for select
to authenticated
using (org_id = auth.uid());

grant select on table public.invites to authenticated;
grant select on table public.invite_redemptions to authenticated;
grant select on table public.bonus_credits_balance to authenticated;
grant select on table public.bonus_credits_grants to authenticated;

-- 5) Helper: random invite code
create or replace function public.scutch_random_invite_code(p_len int default 12)
returns text
language plpgsql
stable
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  out text := '';
  i int;
  idx int;
begin
  if p_len is null or p_len < 6 then
    p_len := 12;
  end if;

  for i in 1..p_len loop
    idx := 1 + floor(random() * length(chars))::int;
    out := out || substr(chars, idx, 1);
  end loop;

  return out;
end;
$$;

-- 6) Create invite (security definer so we don't need client insert policies)
create or replace function public.scutch_create_invite()
returns table (code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_code text;
  v_try int := 0;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'unauthorized' using errcode = '28000';
  end if;

  -- Try a few times to avoid rare collisions.
  loop
    v_try := v_try + 1;
    v_code := public.scutch_random_invite_code(12);

    begin
      insert into public.invites (code, kind, created_by)
      values (v_code, 'user', v_user_id);
      exit;
    exception when unique_violation then
      if v_try >= 5 then
        raise exception 'invite_code_collision' using errcode = 'P0001';
      end if;
    end;
  end loop;

  return query select v_code;
end;
$$;

revoke all on function public.scutch_create_invite() from public;
grant execute on function public.scutch_create_invite() to authenticated;

-- 7) Redeem invite + grant one-time bonus credits (1,000 items)
create or replace function public.scutch_redeem_invite(p_code text)
returns table (
  redeemed boolean,
  already_redeemed boolean,
  bonus_granted boolean,
  bonus_amount_items bigint,
  inviter_user_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_invite public.invites%rowtype;
  v_redemption_id uuid;
  v_bonus_amount bigint := 1000;
  v_grant_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'unauthorized' using errcode = '28000';
  end if;

  if p_code is null or btrim(p_code) = '' then
    raise exception 'missing_code' using errcode = '22023';
  end if;

  select * into v_invite
  from public.invites
  where lower(code) = lower(btrim(p_code))
  limit 1;

  if v_invite.id is null then
    raise exception 'invalid_invite' using errcode = 'P0001';
  end if;

  -- One redemption per invited user.
  begin
    insert into public.invite_redemptions (invite_id, invited_user_id, inviter_user_id)
    values (v_invite.id, v_user_id, v_invite.created_by)
    returning id into v_redemption_id;

    redeemed := true;
    already_redeemed := false;
  exception when unique_violation then
    redeemed := false;
    already_redeemed := true;
    bonus_granted := false;
    bonus_amount_items := 0;
    inviter_user_id := v_invite.created_by;
    return next;
    return;
  end;

  inviter_user_id := v_invite.created_by;

  -- Only grant bonus credits for real user invites (not system bootstrap).
  if v_invite.kind <> 'user' then
    bonus_granted := false;
    bonus_amount_items := 0;
    return next;
    return;
  end if;

  -- Ensure balance row exists.
  insert into public.bonus_credits_balance (org_id, remaining_items, updated_at)
  values (v_user_id, 0, now())
  on conflict (org_id) do nothing;

  -- Grant exactly once per org.
  begin
    insert into public.bonus_credits_grants (org_id, grant_type, amount_items, source_invite_id)
    values (v_user_id, 'invite_welcome_1000', v_bonus_amount, v_invite.id)
    returning id into v_grant_id;

    update public.bonus_credits_balance
    set remaining_items = remaining_items + v_bonus_amount,
        updated_at = now()
    where org_id = v_user_id;

    bonus_granted := true;
    bonus_amount_items := v_bonus_amount;
  exception when unique_violation then
    bonus_granted := false;
    bonus_amount_items := 0;
  end;

  return next;
end;
$$;

revoke all on function public.scutch_redeem_invite(text) from public;
grant execute on function public.scutch_redeem_invite(text) to authenticated;

-- 8) Grandfather existing orgs so they are not gated out.
-- Create a system invite and mark every existing organization as "redeemed".
do $$
declare
  v_system_invite_id uuid;
begin
  select id into v_system_invite_id
  from public.invites
  where kind = 'system' and lower(code) = 'system-bootstrap'
  limit 1;

  if v_system_invite_id is null then
    insert into public.invites (code, kind, created_by)
    values ('system-bootstrap', 'system', null)
    returning id into v_system_invite_id;
  end if;

  insert into public.invite_redemptions (invite_id, invited_user_id, inviter_user_id)
  select v_system_invite_id, o.id, null
  from public.organizations o
  on conflict (invited_user_id) do nothing;
end;
$$;
