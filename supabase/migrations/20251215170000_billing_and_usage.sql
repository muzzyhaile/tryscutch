-- Billing + usage schema for Scutch
-- Authoritative subscription + quota enforcement for Edge Functions.

-- UUID generation
create extension if not exists pgcrypto;

-- Organizations (workspaces). For now, the app uses a "personal org" where org_id == auth.uid().
create table if not exists public.organizations (
  id uuid primary key,
  name text not null default 'Personal',
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('owner','admin','member','viewer')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create table if not exists public.subscriptions (
  org_id uuid primary key references public.organizations(id) on delete cascade,

  -- Scutch plan id
  plan_id text not null check (plan_id in ('starter','pro','enterprise')),
  status text not null check (status in ('active','trialing','past_due','canceled','incomplete')),

  -- Stripe linkage
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,

  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_stripe_customer_id_idx on public.subscriptions(stripe_customer_id);
create index if not exists subscriptions_stripe_subscription_id_idx on public.subscriptions(stripe_subscription_id);

create table if not exists public.usage_monthly (
  org_id uuid not null references public.organizations(id) on delete cascade,
  month date not null,
  analyzed_items bigint not null default 0 check (analyzed_items >= 0),
  analyzed_chars bigint not null default 0 check (analyzed_chars >= 0),
  imported_bytes bigint not null default 0 check (imported_bytes >= 0),
  updated_at timestamptz not null default now(),
  primary key (org_id, month)
);

-- Helper: membership check for RLS and RPC
create or replace function public.is_org_member(p_org_id uuid, p_user_id uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.organization_members m
    where m.org_id = p_org_id
      and m.user_id = p_user_id
  );
$$;

-- Helper: plan limits. Keep this in sync with lib/plans.ts.
create or replace function public.scutch_plan_limits(p_plan_id text)
returns table (
  max_projects bigint,
  max_items_per_analysis bigint,
  max_chars_per_analysis bigint,
  monthly_items bigint
)
language sql
stable
as $$
  select
    case p_plan_id
      when 'starter' then 10
      when 'pro' then 50
      else 9223372036854775807
    end as max_projects,
    case p_plan_id
      when 'starter' then 1000
      when 'pro' then 5000
      else 25000
    end as max_items_per_analysis,
    case p_plan_id
      when 'starter' then 400000
      when 'pro' then 2000000
      else 10000000
    end as max_chars_per_analysis,
    case p_plan_id
      when 'starter' then 10000
      when 'pro' then 50000
      else 500000
    end as monthly_items;
$$;

create or replace function public.scutch_month_start(p_now timestamptz)
returns date
language sql
stable
as $$
  select date_trunc('month', p_now)::date;
$$;

-- Atomic quota consumption.
-- Returns a row with the usage state after the increment.
-- NOTE: Enforced by membership + subscription plan limits.
create or replace function public.scutch_consume_monthly_usage(
  p_org_id uuid,
  p_items_delta bigint,
  p_chars_delta bigint
)
returns table (
  month date,
  plan_id text,
  used_items bigint,
  limit_items bigint
)
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_plan_id text;
  v_month date;
  v_max_items bigint;
  v_max_chars bigint;
  v_monthly_limit bigint;
  v_used bigint;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'unauthorized' using errcode = '28000';
  end if;

  if not public.is_org_member(p_org_id, v_user_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_items_delta is null or p_items_delta <= 0 then
    raise exception 'invalid_items' using errcode = '22023';
  end if;

  if p_chars_delta is null or p_chars_delta < 0 then
    raise exception 'invalid_chars' using errcode = '22023';
  end if;

  select s.plan_id into v_plan_id
  from public.subscriptions s
  where s.org_id = p_org_id;

  if v_plan_id is null then
    raise exception 'missing_subscription' using errcode = 'P0001';
  end if;

  select max_items_per_analysis, max_chars_per_analysis, monthly_items
    into v_max_items, v_max_chars, v_monthly_limit
  from public.scutch_plan_limits(v_plan_id);

  if p_items_delta > v_max_items then
    raise exception 'over_max_items_per_analysis' using errcode = 'P0001';
  end if;

  if p_chars_delta > v_max_chars then
    raise exception 'over_max_chars_per_analysis' using errcode = 'P0001';
  end if;

  v_month := public.scutch_month_start(now());

  insert into public.usage_monthly (org_id, month, analyzed_items, analyzed_chars, updated_at)
  values (p_org_id, v_month, 0, 0, now())
  on conflict (org_id, month) do nothing;

  -- Conditional update: only increment if within monthly cap.
  update public.usage_monthly u
  set
    analyzed_items = u.analyzed_items + p_items_delta,
    analyzed_chars = u.analyzed_chars + p_chars_delta,
    updated_at = now()
  where u.org_id = p_org_id
    and u.month = v_month
    and (u.analyzed_items + p_items_delta) <= v_monthly_limit
  returning u.analyzed_items into v_used;

  if v_used is null then
    raise exception 'over_monthly_limit' using errcode = 'P0001';
  end if;

  return query
  select v_month, v_plan_id, v_used, v_monthly_limit;
end;
$$;

-- RLS
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_monthly enable row level security;

-- Organizations: members can read; user can create personal org (id == auth.uid()).
drop policy if exists organizations_select_members on public.organizations;
create policy organizations_select_members
on public.organizations
for select
to authenticated
using (public.is_org_member(id, auth.uid()));

drop policy if exists organizations_insert_personal on public.organizations;
create policy organizations_insert_personal
on public.organizations
for insert
to authenticated
with check (id = auth.uid());

-- Members: members can read their org membership; personal bootstrap insert is allowed.
drop policy if exists org_members_select on public.organization_members;
create policy org_members_select
on public.organization_members
for select
to authenticated
using (user_id = auth.uid() or public.is_org_member(org_id, auth.uid()));

drop policy if exists org_members_insert_self on public.organization_members;
create policy org_members_insert_self
on public.organization_members
for insert
to authenticated
with check (user_id = auth.uid() and org_id = auth.uid() and role = 'owner');

-- Subscriptions: members can read; only allow inserting a starter subscription for personal org.
drop policy if exists subscriptions_select_members on public.subscriptions;
create policy subscriptions_select_members
on public.subscriptions
for select
to authenticated
using (public.is_org_member(org_id, auth.uid()));

drop policy if exists subscriptions_insert_starter_personal on public.subscriptions;
create policy subscriptions_insert_starter_personal
on public.subscriptions
for insert
to authenticated
with check (
  org_id = auth.uid()
  and plan_id = 'starter'
  and status = 'active'
  and stripe_customer_id is null
  and stripe_subscription_id is null
  and stripe_price_id is null
);

-- Usage: members can read.
drop policy if exists usage_select_members on public.usage_monthly;
create policy usage_select_members
on public.usage_monthly
for select
to authenticated
using (public.is_org_member(org_id, auth.uid()));

-- Make RPC callable by authenticated users.
grant execute on function public.scutch_consume_monthly_usage(uuid, bigint, bigint) to authenticated;
