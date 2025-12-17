-- Adjust Starter monthly analyzed items limit.
-- Keep this in sync with lib/plans.ts

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
      when 'starter' then 1000
      when 'pro' then 50000
      else 500000
    end as monthly_items;
$$;
