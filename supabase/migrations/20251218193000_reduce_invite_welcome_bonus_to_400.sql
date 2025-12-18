-- Reduce invite welcome bonus credits from 1,000 -> 400 for future redemptions.
-- Keep older grants intact (they used grant_type = 'invite_welcome_1000').

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
  v_bonus_amount bigint := 400;
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
    values (v_user_id, 'invite_welcome_400', v_bonus_amount, v_invite.id)
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
