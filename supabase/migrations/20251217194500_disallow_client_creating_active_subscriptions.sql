-- Prevent clients from granting themselves an active plan without Stripe.
-- Subscriptions should be created/updated by server-side processes (Stripe checkout/webhook).

begin;

-- Remove the policy that let any authenticated user insert an 'active' starter subscription.
drop policy if exists subscriptions_insert_starter_personal on public.subscriptions;

commit;
