# Scutch Runbook: CSP (Google Analytics) + Gemini Edge Function (500s)

Last updated: 2025-12-19

This runbook covers:
- Fixing the Google Analytics CSP violation without loosening the policy broadly
- Diagnosing and fixing `POST /functions/v1/gemini` returning 500
- A repeatable deployment + verification checklist

---

## 0) Quick summary (what changed recently)

### CSP
- The effective CSP is injected by Vite in production via a **meta** tag.
- Source of truth is `vite.config.ts`.
- CSP has been updated to allow GA:
  - `script-src` now allows `https://www.googletagmanager.com`
  - `connect-src` now allows `https://www.google-analytics.com` and `https://region1.google-analytics.com`

### Gemini Edge Function
- Bootstrapping subscription insert is now **safe for paid users**:
  - The function checks whether a subscription row exists before inserting the default free subscription.
  - This avoids RLS failures caused by insert-only policies.
- Gemini JSON parsing is now **resilient**:
  - If Gemini returns invalid JSON (common), the function returns **502** with `code: "invalid_model_response"` instead of throwing into a 500.

---

## 1) CSP (Google Analytics) — diagnosis and fix

### 1.1 Symptom
Browser console error similar to:

> Refused to load the script 'https://www.googletagmanager.com/gtag/js?...' because it violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline'".

### 1.2 Root cause
Your production CSP is coming from a Vite build-time transform that injects:

```html
<meta http-equiv="Content-Security-Policy" content="...">
```

Meta CSP is enforced by browsers and will block external scripts unless explicitly allowed.

### 1.3 Fix (already applied in repo)
Update CSP directives in `vite.config.ts`:

- Production meta CSP:
  - `script-src` includes `https://www.googletagmanager.com`
  - `connect-src` includes `https://www.google-analytics.com` and `https://region1.google-analytics.com`

- Dev server CSP header (for local verification) mirrors the same allowlist.

### 1.4 Verify locally
1) Run the app:

```powershell
npm install
npm run dev
```

2) Open DevTools → Console.
3) Accept optional cookies so GA loads.
4) Confirm **no CSP violation** for `googletagmanager.com`.

### 1.5 Verify in production
1) Open the production site.
2) View page source or DevTools Elements.
3) Confirm a CSP meta tag exists and that it includes:
   - `script-src ... https://www.googletagmanager.com`
   - `connect-src ... https://www.google-analytics.com https://region1.google-analytics.com`

### 1.6 Notes (important constraints)
- Your `index.html` currently includes inline `<style>` and inline `<script>`.
  - That requires `'unsafe-inline'` unless you refactor to nonces/hashes.
- `frame-ancestors` cannot be set by meta CSP (must be HTTP header).

---

## 2) Gemini Edge Function — what a 500 usually means

### 2.1 Required secrets
The function depends on these environment variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`

If `GEMINI_API_KEY` is missing, the function will return:
- `500 { error: "Missing GEMINI_API_KEY secret" }`

### 2.2 Authentication requirement
This function requires a valid authenticated user session:
- You must call it with `Authorization: Bearer <user_access_token>`
- A Supabase anon key or a random JWT will not work.

If auth fails, the function returns:
- `401 { error: "Unauthorized" }`

### 2.3 Database prerequisites
The function assumes DB migrations are applied (billing/usage/orgs) and RLS is correct.

Common failure points:
- Org bootstrap upserts blocked by RLS
  - `organizations` upsert
  - `organization_members` upsert
- Usage RPC fails:
  - `scutch_consume_monthly_usage` errors (permissions, signature mismatch, missing tables)

### 2.4 Error code map (what to look for)
The function returns JSON with a `code` in many cases:

- `quota_exceeded` (HTTP 402)
  - Hit plan limits, or missing subscription
- `quota_check_failed` (HTTP 500)
  - RPC failed but was not classified as a quota error
- `invalid_model_response` (HTTP 502)
  - Gemini returned invalid JSON (model output formatting issue)
- `gemini_api_error` (HTTP status mirrors Gemini response)
  - Upstream Gemini API error; response body included in `details`
- `edge_function_error` (HTTP 500)
  - Anything else thrown inside the function

---

## 3) Reproducing Gemini call from Windows PowerShell (no curl alias issues)

### 3.1 Why curl failed in PowerShell
In Windows PowerShell, `curl` is typically an alias for `Invoke-WebRequest`. Header syntax differs.

### 3.2 Correct test command (Invoke-RestMethod)
Fill in:
- `$FunctionUrl` (your project)
- `$AnonKey` (Supabase anon/publishable key)
- `$AccessToken` (a real user access token)

```powershell
$FunctionUrl = "https://hxefkkruzdhxgsvgagsu.supabase.co/functions/v1/gemini"
$AnonKey = "<YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY>"
$AccessToken = "<REAL_USER_ACCESS_TOKEN>"

$Headers = @{
  "apikey" = $AnonKey
  "Authorization" = "Bearer $AccessToken"
  "Content-Type" = "application/json"
}

$Body = @{
  action = "analyzeFeedbackBatch"
  feedbackItems = @("test")
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Method Post -Uri $FunctionUrl -Headers $Headers -Body $Body
```

Expected outcomes:
- Success: HTTP 200 and JSON with `clusters`, `summary`, and `billing`.
- Auth failure: HTTP 401.
- Missing secret: HTTP 500 (Missing GEMINI_API_KEY).
- Invalid model JSON: HTTP 502 (`invalid_model_response`).

---

## 4) Reading logs (what to capture)

You need **two** views:
1) Request logs (status codes, deployment version)
2) Error logs (the actual thrown error / console output)

Capture:
- Function version (e.g., v25, v26)
- Timestamp range
- Request ID (if shown)
- Error payload returned to client (especially `code`)

If you only see `POST 500` without body details, reproduce from PowerShell and record the response.

---

## 5) Deployment checklist

### 5.1 Frontend (CSP)
1) Build:

```powershell
npm run build
```

2) Deploy to your host (Netlify/Vercel/etc).
3) Verify CSP meta tag and GA load behavior.

### 5.2 Supabase Edge Function (gemini)
From the project root, using Supabase CLI:

```powershell
supabase functions deploy gemini
```

Then verify by calling the function using the PowerShell snippet above.

---

## 6) Decision tree for Gemini failures

### If you get 401
- The `Authorization` bearer token is missing or not a real user access token.

### If you get 500: Missing GEMINI_API_KEY secret
- Add `GEMINI_API_KEY` to the Edge Function environment/secrets.

### If you get 500: bootstrap organizations failed / organization_members failed
- RLS is blocking the upsert.
- Confirm policies for `organizations` and `organization_members` allow the authenticated user to upsert their personal org/membership.

### If you get 500: Usage quota check failed
- RPC `scutch_consume_monthly_usage` failed.
- Check:
  - function exists
  - execute grants
  - `search_path` hardened correctly
  - argument names and types match the call: `p_org_id`, `p_items_delta`, `p_chars_delta`

Common specific failure seen in production:
- `column reference "month" is ambiguous`
  - Cause: a version of `scutch_consume_monthly_usage` returned `RETURNS TABLE (month date, ...)` which creates an OUT variable named `month` that conflicts with `usage_monthly.month`.
  - Fix: apply the migration that renames the return column to `usage_month`.
    - Repo: `supabase/migrations/20251219100000_fix_usage_rpc_month_ambiguity_in_bonus_credits.sql`

### If you get 502: invalid_model_response
- Gemini responded with non-JSON or wrapped output.
- This is a model-formatting issue, not your DB.
- Retry; if persistent, tighten prompting or switch model.

### If you get 4xx/5xx with code gemini_api_error
- Upstream Gemini failure.
- The response body will be in `details`.

---

## 7) Known structural constraints / next hardening steps (optional)

These are not required to restore functionality, but are useful if you want to harden further:
- Move CSP from meta tag to real HTTP headers (Netlify `_headers` / Vercel config) so you can enforce:
  - `frame-ancestors`
  - stronger policy controls
- Replace inline scripts/styles in `index.html` with bundled assets or CSP nonces/hashes to remove `'unsafe-inline'`.

