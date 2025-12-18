# Security Documentation

## Overview

This document outlines the security measures implemented in Scutch and known vulnerabilities with mitigation strategies.

## Security Features Implemented

### 1. **Content Security Policy (CSP)**
- **Location**: `vite.config.ts`, `_headers`, `index.html`
- **Protection**: Prevents XSS attacks, code injection, and clickjacking
- **Features**:
  - Restricts script sources to same-origin only
  - Blocks inline scripts (except for Vite HMR in development)
  - Prevents framing by other sites (`frame-ancestors 'none'`)
  - Forces HTTPS upgrade for all requests

### 2. **Security Headers**
- **X-Frame-Options**: `DENY` - Prevents clickjacking
- **X-Content-Type-Options**: `nosniff` - Prevents MIME sniffing attacks
- **Referrer-Policy**: `strict-origin-when-cross-origin` - Protects user privacy
- **Permissions-Policy**: Disables geolocation, microphone, camera

### 3. **Rate Limiting**
- **Location**: `supabase/functions/_shared/ratelimit.ts`
- **Implementation**: In-memory rate limiter (per Edge Function instance)
- **Limits**:
  - Global: 100 requests/minute per user
  - Expensive operations (AI analysis, research): 5 requests/minute per user
  - Standard operations: 20 requests/minute per user
- **Headers**: Returns `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`

### 4. **Authentication & Authorization**
- **Method**: OAuth 2.0 (Google Sign-In only)
- **Row-Level Security (RLS)**: Enforced at database level for all tables
- **Session Management**: Automatic JWT refresh, localStorage persistence
- **API Key Management**: Gemini API key stored as Edge Function secret

### 5. **Quota Enforcement**
- **Location**: `supabase/migrations/20251215170000_billing_and_usage.sql`
- **Implementation**: Database-level enforcement via `scutch_consume_monthly_usage` RPC
- **Features**:
  - Atomic quota consumption (prevents race conditions)
  - Plan-based limits (Free, Starter, Pro, Enterprise)
  - Monthly quota reset
  - Per-analysis size limits

### 6. **Input Validation**
- UUID validation before database queries
- File size limits (5MB - 100MB based on plan)
- File type validation (CSV, Excel, PDF)
- Cell normalization to prevent XSS
- Column detection using heuristics (not user-provided)

### 7. **Self-Hosted Dependencies**
- Fonts self-hosted via `@fontsource/inter` (eliminates CDN dependency)
- No external CDN resources (except Supabase and Gemini API)

### 8. **Error Handling**
- React ErrorBoundary for unhandled exceptions
- Centralized logger with sensitive data redaction
- Production-mode log suppression (debug/info only in dev)

### 9. **TypeScript Enforcement**
- Full TypeScript in Edge Functions (no `@ts-nocheck`)
- Type-safe API request bodies
- Strict compiler options

## Known Vulnerabilities & Mitigation

### 1. **xlsx Library (HIGH)**

**Issue**:
- **CVE**: GHSA-4r6h-8v6p-xvw6 (Prototype Pollution), GHSA-5pgg-2g8v-p4x9 (ReDoS)
- **Severity**: High
- **Location**: `services/universalImport.ts`
- **Status**: No fix available from upstream

**Mitigation Strategies Implemented**:
1. **File Size Limits**: Strictly enforced (5MB - 100MB based on plan)
2. **Row Limits**: Maximum rows enforced before processing
3. **Timeout Protection**: Import operations have time limits
4. **User Isolation**: RLS ensures users can only import to their own projects
5. **Input Validation**: All imported data normalized and validated

**Mitigation Strategies Recommended**:
- [ ] Consider migrating to `exceljs` (maintained, no known vulnerabilities)
- [ ] Add Excel file sandboxing (process in isolated context)
- [ ] Implement malicious pattern detection
- [ ] Add request-level timeouts for Excel parsing

**Risk Assessment**:
- **Likelihood**: Low (requires authenticated user with valid subscription)
- **Impact**: Medium (could cause DoS or data corruption in user's own data)
- **Overall Risk**: Medium-Low

### 2. **CORS Wildcard**

**Issue**:
- `Access-Control-Allow-Origin: *` allows any origin
- **Location**: `supabase/functions/gemini/index.ts`, `supabase/functions/stripe-webhook/index.ts`

**Justification**:
- Required for public form submissions (shareable forms)
- RLS policies ensure data security at database level
- Authentication required for all state-changing operations

**Mitigation**:
- All data access controlled by RLS policies
- Public forms have separate, restricted RLS policies
- No sensitive data exposed via public endpoints

## Security Best Practices

### For Developers

1. **Never commit secrets**: Use `.env.local` for local development
2. **Always use RLS**: Every new table must have RLS policies
3. **Validate inputs**: Use TypeScript types and runtime validation
4. **Review dependencies**: Run `npm audit` before deployments
5. **Test security**: Use the security checklist below

### For Deployment

1. **Set environment variables**: Configure secrets in hosting platform
2. **Enable HSTS**: Uncomment `Strict-Transport-Security` in `_headers` after SSL setup
3. **Monitor rate limits**: Watch for abuse patterns
4. **Rotate secrets**: Regularly rotate API keys and database passwords
5. **Backup database**: Regular automated backups with point-in-time recovery

## Security Checklist

- [x] CSP headers configured
- [x] Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- [x] Rate limiting on API endpoints
- [x] Authentication required for all protected routes
- [x] RLS policies on all tables
- [x] Input validation and sanitization
- [x] Error handling with sensitive data redaction
- [x] Self-hosted dependencies (no external CDNs)
- [x] TypeScript strict mode enabled
- [x] Quota enforcement at database level
- [ ] HSTS enabled (requires SSL certificate)
- [ ] Dependency vulnerability scanning in CI/CD
- [ ] Excel library migration (xlsx → exceljs)
- [ ] Audit logging for sensitive operations
- [ ] Field-level encryption for PII

## Reporting Security Issues

If you discover a security vulnerability, please email: security@triscutch.com

Do NOT create a public GitHub issue for security vulnerabilities.

## Security Updates

- **2025-01-XX**: Initial security implementation
  - Added CSP and security headers
  - Implemented rate limiting
  - Removed hardcoded credentials
  - Self-hosted fonts
  - Enabled TypeScript in Edge Functions
  - Fixed jsPDF/DOMPurify vulnerability (v3.0.4)

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Content Security Policy Reference](https://content-security-policy.com/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
