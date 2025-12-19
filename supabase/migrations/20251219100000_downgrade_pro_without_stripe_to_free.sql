-- Downgrade any "paid" subscriptions that have no Stripe linkage.
-- Paid plan upgrades must come from Stripe checkout/webhook.

begin;

update public.subscriptions
set plan_id = 'free', updated_at = now()
where plan_id = 'pro'
  and status = 'active'
  and stripe_customer_id is null
  and stripe_subscription_id is null
  and stripe_price_id is null;

commit;
