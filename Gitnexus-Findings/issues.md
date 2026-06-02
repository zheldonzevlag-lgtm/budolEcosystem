# budolEcosystem - Issues & Findings

**Audit Date:** 2026-06-02
**Auditor:** OpenClaude Code Intelligence (GitNexus + Security Audit)
**Scope:** Full codebase review

---

## Summary

| Severity | Count | Description |
|----------|-------|-------------|
| **CRITICAL** | 5 | Immediate security risks requiring urgent action |
| **HIGH** | 9 | Significant security vulnerabilities |
| **MEDIUM** | 8 | Code quality and security best practices |
| **LOW** | 4 | Minor issues and technical debt |
| **TOTAL** | **26** | |

---

## CRITICAL SEVERITY (5)

### SEC-001: Exposed .env Files Committed to Git

**Status:** OPEN
**Category:** Security / Secrets Management
**Impact:** All production secrets compromised if repository is pushed to remote

**Description:**
Five `.env` files are tracked in the repository containing production-grade secrets. Despite `.gitignore` listing `.env` as excluded, these files are already committed.

**Affected Files:**
- `.env` (root)
- `budolAccounting-0.1.0/.env`
- `budolID-0.1.0/.env`
- `budolpay-0.1.0/services/wallet-service/.env`
- `budolpay-0.1.0/packages/database/.env`

**Exposed Secrets:**
- PostgreSQL passwords (`r00t`)
- JWT Secret (`budol-ecosystem-local-secret-key-2024`)
- Cloudinary API Key/Secret
- Lalamove Client ID/Secret
- PayMongo Public/Secret Keys
- Prisma Accelerate connection string with embedded JWT
- Vercel OIDC Token

**Remediation:**
1. Rotate ALL exposed secrets immediately
2. Remove `.env` files from git history using `git filter-branch` or BFG Repo-Cleaner
3. Add `.env` to `.gitignore` (already done, but files are tracked)
4. Use a secrets manager (AWS Secrets Manager, HashiCorp Vault) for production

---

### SEC-002: Hardcoded JWT Secret with Fallback

**Status:** OPEN
**Category:** Security / Authentication
**Impact:** All JWT tokens forgeable if JWT_SECRET env var is missing

**Description:**
A hardcoded JWT secret `GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc=` is used as a fallback across 9 locations. If the `JWT_SECRET` environment variable is not set, this value is used in production.

**Affected Files:**
- `budolID-0.1.0/index.js:94`
- `budolpay-0.1.0/packages/database/auth.js:5`
- `budolpay-0.1.0/check_verify_response.js:7`
- `budolpay-0.1.0/test_verify_local.js:6`
- `budolpay-0.1.0/test_verify_endpoint.js:17`
- `budolpay-0.1.0/apps/admin/app/api/auth/login/mobile/verify-pin/route.ts:9`
- `budolpay-0.1.0/apps/admin/app/api/auth/login/mobile/setup-pin/route.ts:9`
- `budolpay-0.1.0/apps/admin/app/api/auth/favorites/route.ts:6`
- `budolpay-0.1.0/apps/admin/app/api/auth/favorites/[recipientId]/route.ts:6`

**Remediation:**
1. Remove all hardcoded fallbacks
2. Throw an error if JWT_SECRET is not set at startup
3. Use a strong, randomly generated secret (256-bit minimum)

---

### SEC-003: Hardcoded SSO API Keys and Secrets

**Status:** OPEN
**Category:** Security / Secrets Management
**Impact:** SSO system compromised, any app can impersonate ecosystem apps

**Description:**
SSO ecosystem app API keys and secrets are hardcoded in source code instead of being read from environment variables.

**Affected Files:**
- `budolID-0.1.0/index.js:38-43` - API keys: `bp_key_2025`, `bs_key_2025`
- `budolpay-0.1.0/packages/database/prisma/seed.js:99-101` - API keys and secrets
- `budolpay-0.1.0/apps/admin/app/api/auth/login/route.ts:71` - Comment acknowledges issue

**Hardcoded Values:**
- `bp_key_2025` / `bp_secret_2025` (budolPay)
- `bs_key_2025` / `bs_secret_2025` (budolShap)
- `be_key_2025` / `be_secret_2025` (budolExpress)

**Remediation:**
1. Move all API keys/secrets to environment variables
2. Generate cryptographically random keys for production
3. Rotate keys regularly

---

### SEC-004: Hardcoded Production Passwords in Source Code

**Status:** OPEN
**Category:** Security / Credentials
**Impact:** Admin accounts compromised, credential reuse attacks

**Description:**
Real production passwords are hardcoded in seed scripts and test files.

**Affected Files:**
- `budolID-0.1.0/seed_user.js:12` - Password: `tr@1t0r!` for `reynaldomgalvez@gmail.com`
- `scripts/test_scripts/test_sso_login.js:7-8` - Password: `tr@1t0r2026!`
- `budolpay-0.1.0/packages/database/prisma/seed.js:7` - Weak password: `admin123`
- `budolpay-0.1.0/apps/admin/create_admin.js:8` - Password: `adm1n1str@1t0r`
- `scripts/test_scripts/provision-admin.js:15` - Password: `tr@1t0r`

**Remediation:**
1. Remove all hardcoded passwords from source code
2. Use environment variables for seed passwords
3. Generate strong random passwords for production
4. Rotate all compromised passwords immediately

---

### SEC-005: Cloudinary Secrets Hardcoded in Source Code

**Status:** OPEN
**Category:** Security / Secrets Management
**Impact:** Cloudinary account compromised, unauthorized image uploads

**Description:**
Cloudinary API secrets and key are hardcoded directly in a test file.

**Affected File:**
- `budolpay-0.1.0/services/verification-service/test_cloudinary.js:3-8`

**Hardcoded Values:**
- API Secret: `USb6SDEDehMLyw9_HlFC1wDqlDE`
- API Key: `537684148625265`

**Remediation:**
1. Remove hardcoded credentials from test files
2. Use environment variables for all API keys
3. Rotate compromised Cloudinary credentials

---

## HIGH SEVERITY (9)

### SEC-006: XSS Vulnerability - dangerouslySetInnerHTML

**Status:** OPEN
**Category:** Security / XSS
**Impact:** Malicious JavaScript execution in user browsers

**Description:**
Product descriptions from the database are rendered as raw HTML without sanitization using `dangerouslySetInnerHTML`.

**Affected File:**
- `budolshap-0.1.0/components/ProductDescription.jsx:27`

```jsx
<div className="max-w-xl ck-content" dangerouslySetInnerHTML={{ __html: product.description }} />
```

**Remediation:**
1. Sanitize HTML using DOMPurify or similar library
2. Implement Content Security Policy (CSP)
3. Validate and sanitize all user input on the server side

---

### SEC-007: Unauthenticated Webhook Endpoint

**Status:** OPEN
**Category:** Security / Authentication
**Impact:** Payment fraud - orders can be marked as paid without payment

**Description:**
The BudolPay webhook endpoint processes payment success events without verifying the webhook signature.

**Affected File:**
- `budolshap-0.1.0/app/api/webhooks/budolpay/route.js:52-53`

```js
// Security: In a production environment, we would verify a signature here.
// For Phase 2, we'll process the event based on the 'payment.success' type.
```

**Remediation:**
1. Implement webhook signature verification
2. Validate payment status with payment gateway before marking as paid
3. Add IP allowlisting for webhook sources

---

### SEC-008: CORS Wildcard Origin on All Services

**Status:** OPEN
**Category:** Security / CORS
**Impact:** Cross-site request forgery, data theft from any origin

**Description:**
Multiple services use `origin: '*'` with `credentials: true`, allowing any website to make authenticated requests.

**Affected Files:**
- `websocket-server/server.js:11, 16`
- `budolAccounting-0.1.0/index.js:58`
- `budolID-0.1.0/index.js:237`
- `budolpay-0.1.0/services/wallet-service/index.js:21`
- `budolpay-0.1.0/services/transaction-service/index.js:26`
- `budolpay-0.1.0/services/auth-service/index.js:134`
- `budolpay-0.1.0/services/verification-service/index.js:103`
- `budolpay-0.1.0/services/api-gateway/index.js:36`

**Remediation:**
1. Replace `origin: '*'` with explicit allowed origins
2. Use environment variables for allowed origins
3. Remove `credentials: true` when using wildcard origin

---

### SEC-009: Unauthenticated Financial Transfer Endpoint

**Status:** OPEN
**Category:** Security / Authentication
**Impact:** Unauthorized money transfers from any user's wallet

**Description:**
The P2P transfer endpoint has no authentication middleware. The `senderId` is taken from the request body, not from a verified JWT token.

**Affected File:**
- `budolpay-0.1.0/apps/admin/app/api/transactions/transfer/route.ts`

**Remediation:**
1. Add authentication middleware to the endpoint
2. Extract `senderId` from verified JWT token, not request body
3. Implement transaction signing/verification

---

### SEC-010: Unauthenticated Payment Endpoint

**Status:** OPEN
**Category:** Security / Authentication
**Impact:** Unauthorized payment initiation on behalf of other users

**Description:**
The GCash payment creation endpoint has no authentication. It relies on `userId` from the request body.

**Affected File:**
- `budolshap-0.1.0/app/api/payment/gcash/create/route.js`

**Remediation:**
1. Add authentication middleware
2. Verify `userId` matches the authenticated user
3. Implement CSRF protection

---

### SEC-011: Credential Leakage in Login Failure Redirect

**Status:** OPEN
**Category:** Security / Information Disclosure
**Impact:** Plaintext password exposed in browser history, logs, and referrer headers

**Description:**
On failed SSO login, the plaintext password is included in the URL redirect as a query parameter.

**Affected File:**
- `budolID-0.1.0/index.js:1297`

```js
return res.redirect(`/login?apiKey=${activeApiKey}&redirect_uri=${encodeURIComponent(redirect_uri || '')}&error=1&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
```

**Remediation:**
1. Remove password from redirect URL
2. Use POST for login form submission
3. Store error state in session, not URL parameters

---

### SEC-012: SSL Certificate Verification Disabled

**Status:** OPEN
**Category:** Security / Transport Layer
**Impact:** Man-in-the-middle attacks on database connections

**Description:**
Multiple database migration scripts disable SSL certificate verification.

**Affected Files:**
- `scripts/lambda_db_init.js:11`
- `scripts/lambda_db_verify.js:14`
- `budolshap-0.1.0/scripts/transfer-to-vercel.js:141`
- `budolshap-0.1.0/scripts/auto-migrate-vercel.js:10`
- `budolshap-0.1.0/scripts/restore-to-vercel.js:104`
- `budolshap-0.1.0/scripts/restore-ecosystem-vercel.js:24`
- `budolshap-0.1.0/scripts/manual-data-sync.js:13`
- `budolshap-0.1.0/scripts/init-vercel-schema.js:9`

**Remediation:**
1. Enable SSL verification for all database connections
2. Use proper CA certificates
3. Never disable SSL in production

---

### SEC-013: Command Injection Risk in API Route

**Status:** OPEN
**Category:** Security / Command Injection
**Impact:** Remote code execution if script path is compromised

**Description:**
An API endpoint uses `execSync` to run a script. While the path is not directly user-controlled, this is a dangerous pattern.

**Affected File:**
- `budolshap-0.1.0/app/api/system/error-tracking/route.js:54-57`

**Remediation:**
1. Use `execFile` instead of `execSync` to avoid shell interpretation
2. Validate and sanitize all inputs
3. Consider using a task queue instead of synchronous execution

---

### SEC-014: Unauthenticated WebSocket Trigger Endpoint

**Status:** OPEN
**Category:** Security / Authentication
**Impact:** Fake event broadcasting to all connected clients

**Description:**
The WebSocket `/trigger` endpoint accepts any channel, event, and data without authentication or rate limiting.

**Affected File:**
- `websocket-server/server.js:41-53`

**Remediation:**
1. Add authentication to the trigger endpoint
2. Implement rate limiting
3. Validate channel names and event types
4. Use API keys or JWT for authorization

---

## MEDIUM SEVERITY (8)

### SEC-015: Missing Rate Limiting on Critical Endpoints

**Status:** OPEN
**Category:** Security / Rate Limiting
**Impact:** Brute force attacks, OTP flooding, resource exhaustion

**Description:**
Rate limiting is only implemented on admin login. All other critical endpoints have no rate limiting.

**Unprotected Endpoints:**
- All budolID SSO endpoints
- OTP verification endpoints
- Password reset endpoints
- Payment endpoints
- P2P transfer endpoints
- Webhook endpoints
- WebSocket trigger endpoint

**Remediation:**
1. Implement rate limiting on all authentication endpoints
2. Use Redis-backed rate limiting for distributed systems
3. Add progressive delays for failed attempts

---

### SEC-016: Weak JWT Token Expiration

**Status:** OPEN
**Category:** Security / Authentication
**Impact:** Extended window for token theft and misuse

**Description:**
Mobile JWT tokens expire after 30 days, which is excessive for a financial application.

**Affected Files:**
- `budolpay-0.1.0/apps/admin/app/api/auth/login/mobile/verify-pin/route.ts:129`
- `budolpay-0.1.0/services/auth-service/index.js:987`

**Remediation:**
1. Reduce access token expiration to 15-60 minutes
2. Implement refresh token rotation
3. Use short-lived tokens with secure refresh mechanism

---

### SEC-017: Middleware Does Not Protect API Routes

**Status:** OPEN
**Category:** Security / Authentication
**Impact:** API routes rely on individual implementation for auth

**Description:**
The admin middleware explicitly excludes all `/api` routes from authentication checks.

**Affected File:**
- `budolpay-0.1.0/apps/admin/middleware.ts:28-37`

**Remediation:**
1. Include API routes in middleware authentication
2. Use middleware for consistent auth across all routes
3. Implement route-level auth as defense in depth

---

### SEC-018: Open Redirect Potential in SSO Callback

**Status:** OPEN
**Category:** Security / Open Redirect
**Impact:** Users redirected to malicious sites after authentication

**Description:**
The SSO callback uses the `host` header which is user-controlled.

**Affected File:**
- `budolpay-0.1.0/apps/admin/app/api/auth/callback/route.ts:116-120`

**Remediation:**
1. Validate the host against a whitelist
2. Use environment variables for allowed redirect domains
3. Never trust user-controlled headers for redirects

---

### SEC-019: Sensitive Data Logged to Console

**Status:** OPEN
**Category:** Security / Information Disclosure
**Impact:** Credentials and sensitive data in logs

**Description:**
Multiple locations log sensitive data including API keys, OTP codes, and JWT secrets.

**Affected Files:**
- `budolID-0.1.0/index.js:266` - Logs API keys
- `budolID-0.1.0/index.js:1386-1387` - Logs OTP codes
- `budolID-0.1.0/index.js:1766` - Logs login attempts with credentials
- `scripts/test_scripts/verify-jwt-sync.js:16-17` - Logs JWT secrets
- `budolpay-0.1.0/apps/admin/app/api/auth/callback/route.ts:54` - Logs verification data

**Remediation:**
1. Remove all sensitive data from logs
2. Use structured logging with redaction
3. Implement log sanitization middleware

---

### SEC-020: Cookie Security Flags Missing in Development

**Status:** OPEN
**Category:** Security / Cookies
**Impact:** Authentication tokens sent over unencrypted HTTP

**Description:**
The `secure` flag on cookies is only set in production.

**Affected File:**
- `budolpay-0.1.0/apps/admin/app/api/auth/login/route.ts:199`

**Remediation:**
1. Set `secure: true` for all environments except local development
2. Use `SameSite=Strict` or `SameSite=Lax`
3. Set `HttpOnly` flag on all authentication cookies

---

### SEC-021: Content Security Policy Disabled

**Status:** OPEN
**Category:** Security / CSP
**Impact:** XSS attacks not mitigated by CSP

**Description:**
Content Security Policy is disabled in the API Gateway.

**Affected File:**
- `budolpay-0.1.0/services/api-gateway/index.js:42`

**Remediation:**
1. Enable CSP with appropriate directives
2. Use nonces or hashes for inline scripts
3. Report CSP violations for monitoring

---

### SEC-022: Empty Catch Blocks (Silent Error Swallowing)

**Status:** OPEN
**Category:** Code Quality / Error Handling
**Impact:** Errors silently ignored, making debugging difficult

**Description:**
Multiple locations have empty catch blocks that silently swallow errors.

**Affected Files:**
- `budolID-0.1.0/tests/ssoRedirection.test.js:73`
- `budolpay-0.1.0/apps/admin/lib/realtime-server.ts:133`
- `budolpay-0.1.0/services/verification-service/fix_env.js:16`
- `budolpay-0.1.0/apps/admin/app/transactions/page.tsx:36, 58`
- `budolpay-0.1.0/apps/admin/app/api/auth/callback/route.ts:170`
- `budolshap-0.1.0/app/payment/return/page.jsx:107`
- `budolshap-0.1.0/scripts/test_scripts_2/reset-admin.js:12-16`

**Remediation:**
1. Log errors even if they're caught and handled
2. Use proper error handling patterns
3. Consider using a centralized error handler

---

## LOW SEVERITY (4)

### SEC-023: Weak Default Admin Credentials

**Status:** OPEN
**Category:** Security / Credentials
**Impact:** Default accounts easily compromised

**Description:**
Seed scripts create admin accounts with weak passwords.

**Affected Files:**
- `budolpay-0.1.0/packages/database/prisma/seed.js:7` - Password: `admin123`

**Remediation:**
1. Use strong, randomly generated passwords for seed data
2. Force password change on first login
3. Remove weak default credentials

---

### SEC-024: Debug/Test Scripts with Real Credentials

**Status:** OPEN
**Category:** Security / Credentials
**Impact:** Credentials exposed in test files

**Description:**
Numerous test scripts contain real credentials and are committed to the repository.

**Affected Files:**
- `scripts/test_scripts/budolID/verify_sso.js:5-6`
- `scripts/test_scripts/budolID/verify-fix.js:7`
- `scripts/test_scripts/budolID/seed-tony-typo.js:9`
- `scripts/test_scripts/budolID/seed-tony-budolid.js:8`
- `scripts/test_scripts/budolID/test-login.js:5-6`
- `scripts/test_scripts/test-sso-login.js:8-9`
- `scripts/test_scripts/sspr_test_full.js:29, 45-46`
- `scripts/test_scripts/test_registration_v3.4.3.js:15`

**Remediation:**
1. Remove all real credentials from test files
2. Use environment variables or test fixtures
3. Add pre-commit hooks to detect credential patterns

---

### SEC-025: Prisma Accelerate Tokens Exposed

**Status:** OPEN
**Category:** Security / Secrets Management
**Impact:** Database access through Prisma connection pooler

**Description:**
Multiple `.env` files contain full Prisma Accelerate connection strings with embedded JWT tokens.

**Affected Files:**
- All 5 `.env` files (line 29 in each)

**Remediation:**
1. Rotate Prisma Accelerate tokens
2. Use separate tokens for development and production
3. Remove tokens from version control

---

### SEC-026: Internal IP Addresses Exposed

**Status:** OPEN
**Category:** Security / Information Disclosure
**Impact:** Development network topology revealed

**Description:**
All `.env` files contain the internal network IP `192.168.1.24`.

**Remediation:**
1. Remove internal IPs from version control
2. Use environment variables for network configuration
3. Use hostnames instead of IP addresses

---

## Additional Code Quality Issues

### TODO/FIXME Items

| File | Line | Issue |
|------|------|-------|
| `budolID-0.1.0/utils/realtime.js:8` | TODO: Replace raw fetch with Pusher/Ably SDK |
| `budolID-0.1.0/utils/phoneNormalization.js:11` | TODO: Extend for non-PH numbers |
| `budolshap-0.1.0/components/OrderItemsList.jsx:57` | TODO: Implement chat functionality |
| `budolshap-0.1.0/components/CategoryIcons.jsx:17` | TODO: (incomplete) |
| `budolshap-0.1.0/components/CategoryIcons.jsx:393` | TODO: Remove legacy API |
| `budolshap-0.1.0/components/auth/MathCaptcha.jsx:8` | TODO: Add refresh button |
| `budolshap-0.1.0/app/store/add-product/page.jsx:36` | TODO: Redirect to create store |
| `budolshap-0.1.0/lib/services/shippingService.js:1050` | TODO: Implement PDF generation |
| `budolshap-0.1.0/lib/redis.js:15-16` | TODO: Phase 5 Redis migration |
| `budolpay-0.1.0/services/transaction-service/index.js:146` | TODO: Add Redis caching |
| `budolpay-0.1.0/services/transaction-service/index.js:369` | TODO: Move threshold to config |
| `budolpay-0.1.0/apps/admin/lib/realtime.ts:13` | TODO: Add Pusher.trigger() calls |
| `documentation/docs_manifest.js:10` | TODO: Re-run on new docs |

### Console.log Statements in Production Code

Excessive `console.log` statements found in production services:
- `websocket-server/server.js` - 8 statements
- `budolID-0.1.0/index.js` - 15+ statements
- Various test scripts

**Recommendation:** Use a proper logging library (winston, pino) with log levels.

### Duplicate Files

- `budolshap-0.1.0/lib/email copy.js` - Duplicate of `email.js`

---

## Remediation Priority

### Immediate (Week 1)
1. Rotate ALL exposed secrets (SEC-001, SEC-002, SEC-003, SEC-004, SEC-005)
2. Remove `.env` files from git history (SEC-001)
3. Add authentication to financial endpoints (SEC-009, SEC-010)
4. Implement webhook signature verification (SEC-007)
5. Fix XSS vulnerability (SEC-006)
6. Remove password from login redirect (SEC-011)

### Short-term (Week 2-3)
1. Fix CORS configuration (SEC-008)
2. Add rate limiting to critical endpoints (SEC-015)
3. Reduce JWT token expiration (SEC-016)
4. Enable SSL verification (SEC-012)
5. Fix middleware to protect API routes (SEC-017)
6. Sanitize logged data (SEC-019)

### Medium-term (Month 1-2)
1. Implement CSP (SEC-021)
2. Fix cookie security flags (SEC-020)
3. Add authentication to WebSocket endpoint (SEC-014)
4. Remove debug credentials (SEC-024)
5. Implement proper error handling (SEC-022)
6. Address all TODO items

### Long-term (Month 2-3)
1. Implement comprehensive logging strategy
2. Add automated security scanning to CI/CD
3. Implement secrets management solution
4. Add automated dependency vulnerability scanning
5. Implement comprehensive test coverage

---

## Tools Used

- **GitNexus** - Code intelligence and relationship analysis
- **Grep** - Pattern-based code search
- **Manual Review** - Security-focused code review

---

*This issues report was generated on 2026-06-02 as part of a comprehensive codebase audit.*
