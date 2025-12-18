-- NOTE (2025-12-18): This migration file is intentionally a no-op.
--
-- The Supabase project already contains `public.forms` and `public.form_responses`
-- (created by earlier migrations). A subsequent migration
-- `20251218101500_forms_public_compat_and_rls.sql` applies the correct
-- compatibility columns and RLS policies for public form links.
--
-- Keeping this file as a no-op avoids breaking `supabase db push` for existing projects.

select 1;
