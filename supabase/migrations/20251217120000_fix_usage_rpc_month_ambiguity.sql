-- Fix: scutch_consume_monthly_usage was failing with
--   ERROR: column reference "month" is ambiguous
-- because the function return column was named `month`, which becomes a
-- plpgsql variable and conflicts with the `usage_monthly.month` column.
--
-- Rename the return column to avoid the conflict.

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
  select v_month as usage_month, v_plan_id, v_used, v_monthly_limit;
end;
$$;

grant execute on function public.scutch_consume_monthly_usage(uuid, bigint, bigint) to authenticated;
