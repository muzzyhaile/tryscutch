-- Fix: the bonus-credits version of scutch_consume_monthly_usage reintroduced
--   ERROR: column reference "month" is ambiguous
-- because the function RETURNS TABLE included an OUT column named `month`.
-- In plpgsql, OUT columns are variables, which conflicted with `usage_monthly.month`.
--
-- Rename the return column to `usage_month` to avoid the conflict.

drop function if exists public.scutch_consume_monthly_usage(uuid, bigint, bigint);

create or replace function public.scutch_consume_monthly_usage(
  p_org_id uuid,
  p_items_delta bigint,
  p_chars_delta bigint
)
returns table (
  usage_month date,
  plan_id text,
  used_items bigint,
  limit_items bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_plan_id text;
  v_month date;
  v_max_items bigint;
  v_max_chars bigint;
  v_monthly_limit bigint;
  v_used bigint;
  v_current bigint;
  v_next bigint;
  v_over bigint;
  v_bonus bigint;
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

  -- Ensure bonus row exists (0 by default).
  insert into public.bonus_credits_balance (org_id, remaining_items, updated_at)
  values (p_org_id, 0, now())
  on conflict (org_id) do nothing;

  -- Lock current usage row for consistent checks/updates.
  select analyzed_items
    into v_current
  from public.usage_monthly
  where org_id = p_org_id
    and month = v_month
  for update;

  if v_current is null then
    raise exception 'usage_row_missing' using errcode = 'P0001';
  end if;

  v_next := v_current + p_items_delta;

  if v_next <= v_monthly_limit then
    update public.usage_monthly
    set
      analyzed_items = v_next,
      analyzed_chars = analyzed_chars + p_chars_delta,
      updated_at = now()
    where org_id = p_org_id
      and month = v_month
    returning analyzed_items into v_used;

    return query
    select v_month as usage_month, v_plan_id, v_used, v_monthly_limit;
  end if;

  -- Over monthly cap: attempt to cover the overage with bonus credits.
  v_over := v_next - v_monthly_limit;

  select remaining_items
    into v_bonus
  from public.bonus_credits_balance
  where org_id = p_org_id
  for update;

  if v_bonus is null then
    v_bonus := 0;
  end if;

  if v_bonus < v_over then
    raise exception 'over_monthly_limit' using errcode = 'P0001';
  end if;

  update public.bonus_credits_balance
  set
    remaining_items = remaining_items - v_over,
    updated_at = now()
  where org_id = p_org_id;

  update public.usage_monthly
  set
    analyzed_items = v_next,
    analyzed_chars = analyzed_chars + p_chars_delta,
    updated_at = now()
  where org_id = p_org_id
    and month = v_month
  returning analyzed_items into v_used;

  return query
  select v_month as usage_month, v_plan_id, v_used, v_monthly_limit;
end;
$$;

grant execute on function public.scutch_consume_monthly_usage(uuid, bigint, bigint) to authenticated;
