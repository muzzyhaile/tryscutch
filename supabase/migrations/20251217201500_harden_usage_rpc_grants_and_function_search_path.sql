-- Harden function search_path (prevents search_path hijacking, especially for SECURITY DEFINER functions)
alter function public.scutch_consume_monthly_usage(uuid, bigint, bigint)
  set search_path = public, pg_temp;

alter function public.is_org_member(uuid, uuid)
  set search_path = public, pg_temp;

alter function public.scutch_plan_limits(text)
  set search_path = public, pg_temp;

alter function public.scutch_month_start(timestamp with time zone)
  set search_path = public, pg_temp;

-- Tighten who can call the usage consumption RPC
revoke all on function public.scutch_consume_monthly_usage(uuid, bigint, bigint) from public;
grant execute on function public.scutch_consume_monthly_usage(uuid, bigint, bigint) to authenticated;
grant execute on function public.scutch_consume_monthly_usage(uuid, bigint, bigint) to service_role;
