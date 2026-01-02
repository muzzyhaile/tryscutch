# Production + Scalability Playbook (Supabase + Vite/React)

This is a practical, execution-first playbook for:
- **A) Production readiness (ops / reliability / security)**
- **B) Scalability (performance / cost / growth)**

Use the checklists as your master to-do list. The intent is to be implementable **today**, without big refactors.

---

## Scope & assumptions
- Frontend: Vite + React + TypeScript
- Backend: Supabase (Auth, Postgres, RLS, Edge Functions)
- Payments: Stripe (Checkout + Billing Portal + Webhook)
- Hosting: Netlify or Vercel (both configs exist in repo)

If any of those assumptions are wrong for your deployment, update this doc and treat it as source-of-truth.

---

# A) Production Readiness Playbook

## Goal
Prevent avoidable outages, make incidents diagnosable, and keep customer data safe.

## A0. “Do this now” (same day)
- [ ] **Confirm production Supabase project is ACTIVE** (avoid surprise pauses) and document the project ref + region.
- [ ] **Lock env correctness** in hosting provider:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` (or legacy `VITE_SUPABASE_ANON_KEY`)
  - [ ] Any app URLs used by OAuth (Supabase Auth → URL Configuration)
- [ ] **Add error visibility**:
  - [ ] Ensure you can access Supabase logs: API, Postgres, Auth, Edge Function logs.
  - [ ] Decide a single place for incident notes (e.g., GitHub Issues “incidents” label).
- [ ] **Verify Stripe secrets and mode**:
  - [ ] Confirm whether prod is using Stripe **live** keys.
  - [ ] Confirm webhook secret matches the Stripe endpoint in the same mode.
- [ ] **Smoke test critical paths** (production URLs):
  - [ ] Sign in with Google
  - [ ] Create/upgrade subscription (Checkout)
  - [ ] Open billing portal
  - [ ] Run an analysis end-to-end

## A1. “Next” (this week)
### Releases (reduce deploy risk)
- [ ] **One-click rollback plan**
  - [ ] Frontend: verify hosting has previous deploy rollback.
  - [ ] Edge Functions: keep a record of last known-good function versions.
- [ ] **Release checklist** (copy/paste into PRs)
  - [ ] `npm test`
  - [ ] Confirm env vars in preview/prod
  - [ ] Confirm Supabase migrations are applied (if any)
  - [ ] Confirm Stripe mode and webhook health

### Monitoring & alerting (catch outages early)
- [ ] **Synthetic uptime checks** (external):
  - [ ] `GET /` (frontend)
  - [ ] A lightweight authenticated call (optional) or health endpoint (if you have one)
  - [ ] `POST /functions/v1/stripe-webhook` (cannot fully test without Stripe; instead alert on Stripe dashboard failures)
- [ ] **Alert channels**
  - [ ] Pager/Slack/email for: elevated 5xx on frontend, elevated edge function errors, Postgres issues.

### Incident response (what to do when it breaks)
Create a simple incident template:
- [ ] Impacted user segment
- [ ] Start time / detection source
- [ ] Mitigation steps taken
- [ ] Root cause
- [ ] Follow-ups

## A2. “Later” (this month)
### Data safety
- [ ] **Backups / recovery**
  - [ ] Confirm backup retention in Supabase plan.
  - [ ] Document the recovery procedure (who, how, and expected time).
- [ ] **RLS + least privilege**
  - [ ] Review RLS coverage for all user-facing tables.
  - [ ] Confirm edge functions that mutate data use service role safely.

### Security hygiene
- [ ] **Secret rotation**
  - [ ] Stripe keys/webhook secret rotation procedure
  - [ ] Supabase publishable key rotation plan (if applicable)
- [ ] **CSP & security headers**
  - [ ] Review and keep aligned with RUNBOOK_CSP_AND_GEMINI.md

---

## A3. Runbooks (copy/paste steps)

### Runbook: “Supabase appears down / Cloudflare 521 / DNS errors”
1) Check Supabase project status (paused/restoring/outage).
2) Check your app’s `VITE_SUPABASE_URL` matches the intended project.
3) Check from 2 networks (office + mobile hotspot) to rule out local DNS.
4) Check Supabase logs for auth/edge failures.
5) If recently restored from pause: wait for DNS/edge to stabilize; keep users informed.

### Runbook: “Stripe checkout fails: No such customer cus_…”
1) Confirm which Stripe mode you’re in (test vs live).
2) Check DB `subscriptions.stripe_customer_id` is from the same mode.
3) If mismatched/stale, clear the linkage or let the hardened edge functions self-heal.
4) Verify webhook is receiving events and updating subscription state.

### Runbook: “Auth login loop / refresh token failures”
1) Check `VITE_SUPABASE_URL` + publishable key.
2) Check Supabase Auth settings: Site URL + Redirect URLs.
3) Check browser console for blocked requests (ad blockers can block unrelated scripts; Supabase fetch failures are separate).
4) Check Supabase Auth logs.

---

# B) Scalability Playbook

## Goal
Handle growth without reliability regressions or runaway cost.

## B0. “Do this now” (same day)
- [ ] **Write down target load** (even rough):
  - [ ] Concurrent users
  - [ ] Analyses/day
  - [ ] Average upload size
- [ ] **Define performance budgets**:
  - [ ] Page load: target LCP under a threshold you choose
  - [ ] Analysis generation: target p95 duration
- [ ] **Track the top 3 slow paths** (from logs and user reports) and keep a short list.

## B1. “Next” (this week)
### Frontend performance
- [ ] **Bundle sanity**
  - [ ] Check Vite build output size and largest chunks.
  - [ ] Lazy-load heavy views (reports/analysis) if not already.
- [ ] **Avoid client re-computation**
  - [ ] Memoize expensive derived data.
  - [ ] Keep large JSON out of React state where possible (store references / paginate).

### Edge Functions
- [ ] **Instrument latency + error rate**
  - [ ] Log request id + duration + important tags (user/org id, route).
- [ ] **Rate-limit abuse prone endpoints**
  - [ ] Use your shared `supabase/functions/_shared/ratelimit.ts` where appropriate.

### Database
- [ ] **Index for your top queries**
  - [ ] Identify slow queries in Postgres logs.
  - [ ] Add indexes via migrations only (no manual prod changes).
- [ ] **Keep rows small**
  - [ ] Store large blobs in Storage rather than Postgres columns.

## B2. “Later” (this month)
### Background work (avoid timeouts)
If analysis generation can be long:
- [ ] Move long-running work to an async pattern:
  - [ ] Create a DB job row
  - [ ] Run worker via Edge Function + queue trigger pattern
  - [ ] Poll status from UI

### Multi-tenant isolation
- [ ] Ensure every tenant/org query is scoped and indexed by `organization_id`.
- [ ] Consider per-tenant usage counters and guardrails (quotas/limits).

### Cost controls
- [ ] Add budgets/alerts (Stripe revenue vs infra spend).
- [ ] Prefer caching and smaller payloads over scaling Postgres vertically.

---

## B3. Verification checklist (repeat quarterly)
- [ ] Run `npm test` and keep tests green.
- [ ] Validate billing flows end-to-end.
- [ ] Review RLS + security advisors.
- [ ] Review slow queries + largest tables.
- [ ] Review edge function error rates + p95 latency.
