-- Add a Free plan and make it the default baseline subscription for new users.

-- 1) Allow 'free' in subscriptions.plan_id
alter table public.subscriptions
  drop constraint if exists subscriptions_plan_id_check;

alter table public.subscriptions
  add constraint subscriptions_plan_id_check
  check (plan_id in ('free','starter','pro','enterprise'));

-- 2) Keep plan limits in sync with lib/plans.ts
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
      when 'free' then 3
      when 'starter' then 10
      when 'pro' then 50
      else 9223372036854775807
    end as max_projects,
    case p_plan_id
      when 'free' then 10
      when 'starter' then 1000
      when 'pro' then 5000
      else 25000
    end as max_items_per_analysis,
    case p_plan_id
      when 'free' then 400000
      when 'starter' then 400000
      when 'pro' then 2000000
      else 10000000
    end as max_chars_per_analysis,
    case p_plan_id
      when 'free' then 10
      when 'starter' then 1000
      when 'pro' then 50000
      else 500000
    end as monthly_items;
$$;

-- 3) If any users were accidentally granted a free 'starter' subscription (no Stripe ids), downgrade them to free.
update public.subscriptions
set plan_id = 'free', updated_at = now()
where plan_id = 'starter'
  and status = 'active'
  and stripe_customer_id is null
  and stripe_subscription_id is null
  and stripe_price_id is null;

-- 4) Allow authenticated users to insert ONLY the baseline free subscription for their personal org.
-- This enables client bootstrap without enabling self-upgrades.
drop policy if exists subscriptions_insert_free_personal on public.subscriptions;
create policy subscriptions_insert_free_personal
on public.subscriptions
for insert
to authenticated
with check (
  org_id = auth.uid()
  and plan_id = 'free'
  and status = 'active'
  and stripe_customer_id is null
  and stripe_subscription_id is null
  and stripe_price_id is null
);
