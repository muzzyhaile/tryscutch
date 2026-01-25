-- Migration: 20260123000000_fix_security_and_performance_advisors.sql

-- 1. Security: Fix mutable search paths
ALTER FUNCTION public.scutch_slugify(text) SET search_path = public;
ALTER FUNCTION public.scutch_random_invite_code(int) SET search_path = public;
ALTER FUNCTION public.scutch_plan_limits(text) SET search_path = public;
ALTER FUNCTION public.scutch_consume_monthly_usage(uuid, bigint, bigint) SET search_path = public;
ALTER FUNCTION public.is_org_member(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.scutch_month_start(timestamptz) SET search_path = public;

-- 2. Performance: Add missing index for foreign keys
CREATE INDEX IF NOT EXISTS bonus_credits_grants_source_invite_id_idx ON public.bonus_credits_grants(source_invite_id);

-- 3. Performance: Optimize RLS policies (wrap auth.uid() in select) & Remove redundant policies

-- === FORMS ===
DROP POLICY IF EXISTS forms_select_own ON public.forms;
DROP POLICY IF EXISTS forms_insert_own ON public.forms;
DROP POLICY IF EXISTS forms_update_own ON public.forms;
DROP POLICY IF EXISTS forms_delete_own ON public.forms;

DROP POLICY IF EXISTS forms_owner_select ON public.forms;
CREATE POLICY forms_owner_select ON public.forms
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS forms_owner_insert ON public.forms;
CREATE POLICY forms_owner_insert ON public.forms
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS forms_owner_update ON public.forms;
CREATE POLICY forms_owner_update ON public.forms
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS forms_owner_delete ON public.forms;
CREATE POLICY forms_owner_delete ON public.forms
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- === FORM RESPONSES ===
DROP POLICY IF EXISTS form_responses_select_own ON public.form_responses;
DROP POLICY IF EXISTS form_responses_insert_own ON public.form_responses;
DROP POLICY IF EXISTS form_responses_update_own ON public.form_responses;
DROP POLICY IF EXISTS form_responses_delete_own ON public.form_responses;

DROP POLICY IF EXISTS form_responses_owner_select ON public.form_responses;
CREATE POLICY form_responses_owner_select ON public.form_responses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.forms f
      WHERE f.id = form_id AND f.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS form_responses_owner_update ON public.form_responses;
CREATE POLICY form_responses_owner_update ON public.form_responses
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.forms f
      WHERE f.id = form_id AND f.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.forms f
      WHERE f.id = form_id AND f.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS form_responses_owner_delete ON public.form_responses;
CREATE POLICY form_responses_owner_delete ON public.form_responses
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.forms f
      WHERE f.id = form_id AND f.user_id = (SELECT auth.uid())
    )
  );


-- === ORGANIZATIONS ===
DROP POLICY IF EXISTS organizations_select_members ON public.organizations;
CREATE POLICY organizations_select_members ON public.organizations
  FOR SELECT TO authenticated
  USING (public.is_org_member(id, (SELECT auth.uid())));

DROP POLICY IF EXISTS organizations_insert_personal ON public.organizations;
CREATE POLICY organizations_insert_personal ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS organizations_update_personal ON public.organizations;
CREATE POLICY organizations_update_personal ON public.organizations
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));


-- === ORGANIZATION_MEMBERS ===
DROP POLICY IF EXISTS org_members_select ON public.organization_members;
CREATE POLICY org_members_select ON public.organization_members
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.is_org_member(org_id, (SELECT auth.uid())));

DROP POLICY IF EXISTS org_members_insert_self ON public.organization_members;
CREATE POLICY org_members_insert_self ON public.organization_members
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) AND org_id = (SELECT auth.uid()) AND role = 'owner');

DROP POLICY IF EXISTS org_members_update_self ON public.organization_members;
CREATE POLICY org_members_update_self ON public.organization_members
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));


-- === PROJECTS ===
DROP POLICY IF EXISTS projects_select_own ON public.projects;
CREATE POLICY projects_select_own ON public.projects
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS projects_insert_own ON public.projects;
CREATE POLICY projects_insert_own ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS projects_update_own ON public.projects;
CREATE POLICY projects_update_own ON public.projects
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS projects_delete_own ON public.projects;
CREATE POLICY projects_delete_own ON public.projects
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));


-- === SUBSCRIPTIONS ===
DROP POLICY IF EXISTS subscriptions_select_members ON public.subscriptions;
CREATE POLICY subscriptions_select_members ON public.subscriptions
  FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, (SELECT auth.uid())));

DROP POLICY IF EXISTS subscriptions_insert_starter_personal ON public.subscriptions;
CREATE POLICY subscriptions_insert_starter_personal ON public.subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id = (SELECT auth.uid())
    AND plan_id = 'starter'
    AND status = 'active'
    AND stripe_customer_id IS NULL
    AND stripe_subscription_id IS NULL
    AND stripe_price_id IS NULL
  );

DROP POLICY IF EXISTS subscriptions_insert_free_personal ON public.subscriptions;
CREATE POLICY subscriptions_insert_free_personal ON public.subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id = (SELECT auth.uid())
    AND plan_id = 'free'
    AND status = 'active'
    AND stripe_customer_id IS NULL
    AND stripe_subscription_id IS NULL
    AND stripe_price_id IS NULL
  );

-- === USAGE_MONTHLY ===
DROP POLICY IF EXISTS usage_select_members ON public.usage_monthly;
CREATE POLICY usage_select_members ON public.usage_monthly
  FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, (SELECT auth.uid())));


-- === INVITES & BONUS CREDITS ===
DROP POLICY IF EXISTS invites_select_own ON public.invites;
CREATE POLICY invites_select_own ON public.invites
  FOR SELECT TO authenticated
  USING (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS invite_redemptions_select_self_or_inviter ON public.invite_redemptions;
CREATE POLICY invite_redemptions_select_self_or_inviter ON public.invite_redemptions
  FOR SELECT TO authenticated
  USING (invited_user_id = (SELECT auth.uid()) OR inviter_user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS bonus_balance_select_self ON public.bonus_credits_balance;
CREATE POLICY bonus_balance_select_self ON public.bonus_credits_balance
  FOR SELECT TO authenticated
  USING (org_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS bonus_grants_select_self ON public.bonus_credits_grants;
CREATE POLICY bonus_grants_select_self ON public.bonus_credits_grants
  FOR SELECT TO authenticated
  USING (org_id = (SELECT auth.uid()));

-- === CONTEXT & FEEDBACK ENTRIES ===

-- Context ICPs
DROP POLICY IF EXISTS context_icps_select_own ON public.context_icps;
CREATE POLICY context_icps_select_own ON public.context_icps
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS context_icps_insert_own ON public.context_icps;
CREATE POLICY context_icps_insert_own ON public.context_icps
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS context_icps_update_own ON public.context_icps;
CREATE POLICY context_icps_update_own ON public.context_icps
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS context_icps_delete_own ON public.context_icps;
CREATE POLICY context_icps_delete_own ON public.context_icps
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Context Product Infos
DROP POLICY IF EXISTS context_product_infos_select_own ON public.context_product_infos;
CREATE POLICY context_product_infos_select_own ON public.context_product_infos
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS context_product_infos_insert_own ON public.context_product_infos;
CREATE POLICY context_product_infos_insert_own ON public.context_product_infos
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS context_product_infos_update_own ON public.context_product_infos;
CREATE POLICY context_product_infos_update_own ON public.context_product_infos
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS context_product_infos_delete_own ON public.context_product_infos;
CREATE POLICY context_product_infos_delete_own ON public.context_product_infos
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Context Market Feedbacks
DROP POLICY IF EXISTS context_market_feedbacks_select_own ON public.context_market_feedbacks;
CREATE POLICY context_market_feedbacks_select_own ON public.context_market_feedbacks
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS context_market_feedbacks_insert_own ON public.context_market_feedbacks;
CREATE POLICY context_market_feedbacks_insert_own ON public.context_market_feedbacks
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS context_market_feedbacks_update_own ON public.context_market_feedbacks;
CREATE POLICY context_market_feedbacks_update_own ON public.context_market_feedbacks
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS context_market_feedbacks_delete_own ON public.context_market_feedbacks;
CREATE POLICY context_market_feedbacks_delete_own ON public.context_market_feedbacks
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Context Product Principles
DROP POLICY IF EXISTS context_product_principles_select_own ON public.context_product_principles;
CREATE POLICY context_product_principles_select_own ON public.context_product_principles
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS context_product_principles_insert_own ON public.context_product_principles;
CREATE POLICY context_product_principles_insert_own ON public.context_product_principles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS context_product_principles_update_own ON public.context_product_principles;
CREATE POLICY context_product_principles_update_own ON public.context_product_principles
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS context_product_principles_delete_own ON public.context_product_principles;
CREATE POLICY context_product_principles_delete_own ON public.context_product_principles
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Feedback Entries
DROP POLICY IF EXISTS feedback_entries_select_own ON public.feedback_entries;
CREATE POLICY feedback_entries_select_own ON public.feedback_entries
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS feedback_entries_insert_own ON public.feedback_entries;
CREATE POLICY feedback_entries_insert_own ON public.feedback_entries
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS feedback_entries_update_own ON public.feedback_entries;
CREATE POLICY feedback_entries_update_own ON public.feedback_entries
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS feedback_entries_delete_own ON public.feedback_entries;
CREATE POLICY feedback_entries_delete_own ON public.feedback_entries
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Profiles
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

