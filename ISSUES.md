# budolEcosystem - Issues & Recommendations

**Audit Date:** 2026-06-02
**Scope:** Full codebase review using GitNexus (26,266 symbols) + Graphify + manual security audit
**Total Issues:** 36 (5 Critical, 9 High, 8 Medium, 4 Low, 10 Code Quality)

---

## Summary

| Severity | Count | Description |
|----------|-------|-------------|
| **CRITICAL** | 5 | Immediate security risks requiring urgent action |
| **HIGH** | 9 | Significant security vulnerabilities |
| **MEDIUM** | 8 | Code quality and security best practices |
| **LOW** | 4 | Minor issues and technical debt |
| **CODE QUALITY** | 10 | Duplicate code, inconsistent versions, missing tests, dead code |
| **TOTAL** | **36** | |

---

## CRITICAL SEVERITY (5)

### CRIT-001: Exposed .env Files with Production Secrets

**Category:** Security / Secrets Management
**Impact:** All production secrets compromised if repository is pushed to remote

**Description:**
The `.gitignore` lists `.env` as excluded, but **5 `.env` files are tracked** containing production-grade secrets. The root `.env` contains 30 lines of credentials.

**Affected Files:**
- `.env` (root)
- `budolAccounting-0.1.0/.env`
- `budolID-0.1.0/.env`
- `budolpay-0.1.0/services/wallet-service/.env`
- `budolpay-0.1.0/packages/database/.env`

**Exposed Secrets:**
| Secret | Location |
|--------|----------|
| PostgreSQL passwords (`r00t`) | All 5 files |
| JWT Secret (`budol-ecosystem-local-secret-key-2024`) | All 5 files |
| Cloudinary API Key/Secret | All 5 files |
| Lalamove Client ID/Secret | All 5 files |
| PayMongo Public/Secret Keys | All 5 files |
| Prisma Accelerate JWT | All 5 files |
| Vercel OIDC Token | All 5 files |

**Recommendation:**
1. **Immediate:** Rotate ALL exposed secrets
2. **Immediate:** Remove `.env` files from git history using `git filter-repo` or BFG Repo-Cleaner
3. **Short-term:** Add pre-commit hooks to prevent `.env` files from being committed
4. **Long-term:** Use a secrets manager (AWS Secrets Manager, HashiCorp Vault)

---

### CRIT-002: Hardcoded JWT Secret Fallback in 12 Files

**Category:** Security / Authentication
**Impact:** All JWT tokens forgeable if JWT_SECRET env var is not set

**Description:**
A hardcoded JWT secret `GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc=` is used as a fallback across 12 locations.

**Affected Files:**
| File | Line |
|------|------|
| `budolID-0.1.0/index.js` | 94 |
| `budolshap-0.1.0/lib/token.js` | 3 |
| `budolshap-0.1.0/lib/token-edge.js` | 3 |
| `budolpay-0.1.0/services/auth-service/index.js` | 164 |
| `budolpay-0.1.0/services/api-gateway/index.js` | 130 |
| `budolpay-0.1.0/apps/admin/app/api/auth/login/mobile/verify-pin/route.ts` | 9 |
| `budolpay-0.1.0/apps/admin/app/api/auth/login/mobile/setup-pin/route.ts` | 9 |
| `budolpay-0.1.0/apps/admin/app/api/auth/favorites/route.ts` | 6 |
| `budolpay-0.1.0/apps/admin/app/api/auth/favorites/[recipientId]/route.ts` | 6 |
| `budolpay-0.1.0/test_verify_local.js` | 6 |
| `budolpay-0.1.0/test_verify_endpoint.js` | 17 |
| `budolpay-0.1.0/check_verify_response.js` | 7 |

**Recommendation:**
1. Remove all hardcoded fallback values
2. Add startup validation: `if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET required')`
3. Rotate the compromised secret immediately

---

### CRIT-003: Hardcoded SSO API Keys in Source Code

**Category:** Security / Secrets Management
**Impact:** SSO system compromised, any app can impersonate ecosystem apps

**Affected Files:**
| File | Line | Value |
|------|------|-------|
| `budolID-0.1.0/index.js` | 38 | `apiKey: 'bp_key_2025'` |
| `budolID-0.1.0/index.js` | 43 | `apiKey: 'bs_key_2025'` |
| `budolpay-0.1.0/packages/database/prisma/seed.js` | 99-101 | `bp_key_2025`, `bp_secret_2025`, `bs_key_2025`, `bs_secret_2025`, `be_key_2025`, `be_secret_2025` |
| `budolpay-0.1.0/apps/admin/app/api/auth/login/route.ts` | 71 | `const apiKey = 'bp_key_2025'` (comment: "This should be in env") |

**Recommendation:**
1. Move all API keys to environment variables
2. Generate cryptographically random keys for production
3. Implement key rotation mechanism

---

### CRIT-004: Hardcoded Production Passwords in Source Code

**Category:** Security / Credentials
**Impact:** Admin accounts compromised

**Affected Files:**
| File | Line | Password |
|------|------|----------|
| `budolID-0.1.0/seed_user.js` | 12 | `tr@1t0r!` (real admin) |
| `scripts/test_scripts/test_sso_login.js` | 7-8 | `tr@1t0r2026!` |
| `budolpay-0.1.0/packages/database/prisma/seed.js` | 7 | `admin123` |
| `budolpay-0.1.0/apps/admin/create_admin.js` | 8 | `adm1n1str@1t0r` |
| `scripts/test_scripts/provision-admin.js` | 15 | `tr@1t0r` |

**Recommendation:**
1. **Immediate:** Change all compromised passwords
2. Remove hardcoded passwords from source code
3. Use environment variables for seed passwords

---

### CRIT-005: Unauthenticated Debug Endpoint Leaking Database URL

**Category:** Security / Authentication
**Impact:** Full database connection string exposed without authentication

**Affected File:**
- `budolpay-0.1.0/services/auth-service/index.js:406-421`
  ```js
  app.get('/debug/db-columns', async (req, res) => {
      // No auth middleware
      res.json({ url: process.env.DATABASE_URL, columns: result });
  });
  ```

**Recommendation:**
1. **Immediate:** Remove or protect with authentication
2. Never expose connection strings in API responses
3. Remove all debug endpoints from production builds

---

## HIGH SEVERITY (9)

### HIGH-001: XSS via dangerouslySetInnerHTML

**Category:** Security / XSS
**File:** `budolshap-0.1.0/components/ProductDescription.jsx:27`

Product descriptions rendered as raw HTML without sanitization.

**Recommendation:**
1. Install DOMPurify: `import DOMPurify from 'dompurify'`
2. Sanitize before rendering: `__html: DOMPurify.sanitize(product.description)`
3. Implement Content Security Policy headers

---

### HIGH-002: Unauthenticated Webhook Endpoint (No Signature Verification)

**Category:** Security / Authentication
**File:** `budolshap-0.1.0/app/api/webhooks/budolpay/route.js:52-53`

Payment webhook processes events without signature verification. Code acknowledges: "In a production environment, we would verify a signature here."

**Recommendation:**
1. Implement HMAC-SHA256 webhook signature verification
2. Validate payment status with gateway before marking orders as paid
3. Add IP allowlisting for webhook sources

---

### HIGH-003: CORS Wildcard on 10 Services

**Category:** Security / CORS
**Impact:** Any website can make authenticated requests

**Affected Files:**
- `websocket-server/server.js:11, 16`
- `budolAccounting-0.1.0/index.js:58`
- `budolID-0.1.0/index.js:237`
- `budolpay-0.1.0/services/wallet-service/index.js:21`
- `budolpay-0.1.0/services/transaction-service/index.js:26`
- `budolpay-0.1.0/services/auth-service/index.js:134`
- `budolpay-0.1.0/services/verification-service/index.js:103`
- `budolpay-0.1.0/services/api-gateway/index.js:36`
- `budolshap-0.1.0/app/api/webhooks/budolpay/route.js:17, 76`

**Recommendation:**
1. Replace `origin: '*'` with explicit allowed origins
2. Use environment variables for allowed origins
3. Never combine `origin: '*'` with `credentials: true`

---

### HIGH-004: Unauthenticated Financial Endpoints

**Category:** Security / Authentication
**Impact:** Unauthorized money transfers and balance modifications

**Affected Files:**
| File | Line | Endpoint |
|------|------|----------|
| `budolpay-0.1.0/services/transaction-service/index.js` | 310 | `POST /transfer` |
| `budolpay-0.1.0/services/transaction-service/index.js` | 577 | `POST /cash-in` |
| `budolpay-0.1.0/services/transaction-service/index.js` | 788 | `POST /cash-out` |
| `budolpay-0.1.0/services/wallet-service/index.js` | 448 | `POST /update-balance` |
| `budolpay-0.1.0/services/settlement-service/index.js` | 104 | `POST /settle/:merchantId` |

**Recommendation:**
1. Add JWT verification middleware to all financial endpoints
2. Extract senderId from verified token, not request body
3. Implement transaction signing for high-value transfers

---

### HIGH-005: Credential Leakage in Login Failure Redirect

**Category:** Security / Information Disclosure
**File:** `budolID-0.1.0/index.js:1297`

Plaintext password included in URL redirect on failed SSO login.

**Recommendation:**
1. **Immediate:** Remove password from redirect URL
2. Use POST for login form submission
3. Store error state in session, not URL parameters

---

### HIGH-006: SSL Certificate Verification Disabled (8 Scripts)

**Category:** Security / Transport Layer
**Impact:** Man-in-the-middle attacks on database connections

**Affected Files:**
- `scripts/lambda_db_init.js:11`
- `scripts/lambda_db_verify.js:14`
- `budolshap-0.1.0/scripts/transfer-to-vercel.js:141`
- `budolshap-0.1.0/scripts/auto-migrate-vercel.js:10`
- `budolshap-0.1.0/scripts/restore-to-vercel.js:104`
- `budolshap-0.1.0/scripts/restore-ecosystem-vercel.js:24`
- `budolshap-0.1.0/scripts/manual-data-sync.js:13`
- `budolshap-0.1.0/scripts/init-vercel-schema.js:9`

**Recommendation:**
1. Use proper CA certificates
2. Never disable SSL verification in production
3. Use `sslmode=verify-full` for PostgreSQL

---

### HIGH-007: Command Injection via shell=True in Python Scripts

**Category:** Security / Command Injection
**Impact:** Remote code execution

**Affected Files:**
- `check_secrets.py:6`, `check_img.py:6`, `check_env.py:6`
- `deploy_shap.py:6`, `deploy_shap_nocache.py:5`, `deploy_id.py:6`
- `register_tasks.py:56`, `force_ecs_update.py:21,27,46,52`
- `update_listener.py:4` (`os.system(cmd)`)
- `budolshap-0.1.0/app/api/system/error-tracking/route.js:57` (`execSync`)

**Recommendation:**
1. Use `subprocess.run(..., shell=False)` with argument lists
2. Use `execFile` instead of `execSync` in Node.js
3. Validate and whitelist all inputs

---

### HIGH-008: Cookie Security Issues

**Category:** Security / Cookies
**File:** `budolshap-0.1.0/app/api/auth/sso/callback/route.js:118-126`

Auth cookies have `httpOnly: false` (readable by JavaScript/XSS) and missing `secure` flag.

**Recommendation:**
1. Set `httpOnly: true` on all auth cookies
2. Set `secure: true` for production
3. Use `SameSite=Strict` or `SameSite=Lax`

---

### HIGH-009: Middleware Does Not Protect API Routes

**Category:** Security / Authentication
**File:** `budolpay-0.1.0/apps/admin/middleware.ts:28-37`

Middleware explicitly excludes all `/api` routes from authentication.

**Recommendation:**
1. Include API routes in middleware authentication
2. Ensure all API routes have individual auth as defense in depth

---

## MEDIUM SEVERITY (8)

### MED-001: Missing Rate Limiting on Critical Endpoints

**Category:** Security / Rate Limiting

Rate limiting only on admin login. No rate limiting on: SSO login, registration, OTP verification, password reset, payment, P2P transfer, webhook, or WebSocket trigger endpoints.

**Recommendation:** Implement Redis-backed rate limiting on all authentication and financial endpoints.

---

### MED-002: Weak JWT Token Expiration (30 Days)

**Category:** Security / Authentication
**Files:** `budolpay-0.1.0/apps/admin/app/api/auth/login/mobile/verify-pin/route.ts:129`, `budolpay-0.1.0/services/auth-service/index.js:987`

Mobile JWT tokens expire after 30 days. Industry standard for financial apps is 15-60 minutes.

**Recommendation:** Reduce to 15-60 minute access tokens with refresh token rotation.

---

### MED-003: Open Redirect in SSO Callback

**Category:** Security / Open Redirect
**File:** `budolpay-0.1.0/apps/admin/app/api/auth/callback/route.ts:116-120`

Host header is user-controlled and used for redirect.

**Recommendation:** Validate redirect URLs against a whitelist of allowed domains.

---

### MED-004: Sensitive Data Logged to Console

**Category:** Security / Information Disclosure

**Affected Files:**
- `budolID-0.1.0/index.js:266` - Logs API keys
- `budolID-0.1.0/index.js:1387` - Logs OTP codes in plaintext
- `budolID-0.1.0/index.js:1766` - Logs login attempts with credentials
- `scripts/test_scripts/verify-jwt-sync.js:16-17` - Logs JWT secrets
- `budolshap-0.1.0/lib/email copy.js:356` - Unconditional OTP logging

**Recommendation:** Remove all sensitive data from logs. Use the existing `maskPII()` helper consistently.

---

### MED-005: Unauthenticated WebSocket Trigger Endpoint

**Category:** Security / Authentication
**File:** `websocket-server/server.js:41-53`

The `/trigger` endpoint accepts any channel, event, and data without authentication or rate limiting.

**Recommendation:** Add API key or JWT verification. Implement rate limiting.

---

### MED-006: Content-Security-Policy Disabled

**Category:** Security / CSP
**File:** `budolpay-0.1.0/services/api-gateway/index.js:42`

**Recommendation:** Enable CSP with appropriate directives for production.

---

### MED-007: Empty Catch Blocks (11 Locations)

**Category:** Code Quality / Error Handling

Silent error swallowing in production code and test files.

**Recommendation:** Log errors. For intentional ignores, add comments.

---

### MED-008: Missing Security Headers on 8 Services

**Category:** Security / Headers

Only the API Gateway uses `helmet`. budolID, budolAccounting, and all other microservices have no security headers.

**Recommendation:** Add `helmet()` middleware to all Express services.

---

## LOW SEVERITY (4)

### LOW-001: Weak Default Admin Credentials
- `budolpay-0.1.0/packages/database/prisma/seed.js:7` - `admin123`

### LOW-002: Debug/Test Scripts with Real Credentials
- 8+ test files containing real passwords and API keys

### LOW-003: Prisma Accelerate Tokens Exposed in .env Files

### LOW-004: Internal IP Addresses Exposed (`192.168.1.24`)

---

## CODE QUALITY ISSUES (10)

### CQ-001: Duplicate File - email copy.js
- `budolshap-0.1.0/lib/email copy.js` is an exact duplicate of `email.js` (695 vs 699 lines)
- The copy has unconditional OTP logging (security concern)

### CQ-002: Backup Files in Production Tree
- `budolpay-0.1.0/apps/admin/components/Sidebar-orig.tsx`
- `budolshap-0.1.0/backup/` - 7 `.backup` files
- `budolshap-0.1.0/app/api/webhooks/lalamove/route.js.backup`
- `budolid.backup` (root)

### CQ-003: Duplicated Phone Normalization (3 Implementations)
- `budolID-0.1.0/utils/phoneNormalization.js` (77 lines)
- `budolshap-0.1.0/lib/utils/phone-utils.js` (38 lines)
- `budolPayMobile/lib/utils/phone_utils.dart` (32 lines)

### CQ-004: Inconsistent Prisma Versions
- budolpay: 5.14.0, budolshap: ^6.19.0, budolID: 5.14.0, budolAccounting: ^5.x

### CQ-005: Inconsistent Express Versions
- budolAccounting: ^4.18.2, websocket: ^4.21.1, budolpay services: ^5.2.1

### CQ-006: Missing Test Infrastructure
- No tests: budolAccounting, websocket-server, settlement-service, api-gateway, wallet-service, verification-service
- budolID: only 1 test file

### CQ-007: 100+ Console.log Statements in Production Code
- All 6 microservices, 28+ admin files, core library files

### CQ-008: 32 .env Files Across Codebase
- `.gitignore` only excludes `.env` and `.env.local`, not `.env.production`, `.env.vercel`, etc.

### CQ-009: Temporary/Scratch Files in Production Tree
- `tmp_*.ts/js` files, `scratch/` directories, 50+ root-level ad-hoc scripts

### CQ-010: Mixed Module Systems (CommonJS vs ESM)
- budolshap: ESM (`"type": "module"`), budolpay services: CommonJS, budolID: CommonJS

---

## TODO/FIXME Items (12)

| File | Line | TODO |
|------|------|------|
| `budolID-0.1.0/utils/realtime.js` | 8 | Replace raw fetch with Pusher/Ably SDK |
| `budolID-0.1.0/utils/phoneNormalization.js` | 11 | Extend for non-PH numbers |
| `budolpay-0.1.0/services/transaction-service/index.js` | 146 | Integrate Redis caching |
| `budolpay-0.1.0/services/transaction-service/index.js` | 369 | Move threshold to env var |
| `budolpay-0.1.0/apps/admin/lib/realtime.ts` | 13 | Add Pusher.trigger() calls |
| `budolpay-0.1.0/apps/admin/app/api/verification/[...path]/route.ts` | 9 | Add file upload size limits |
| `budolshap-0.1.0/lib/redis.js` | 15-17 | Migrate to Redis-backed rate limiting |
| `budolshap-0.1.0/lib/services/shippingService.js` | 1050 | Implement PDF generation |
| `budolshap-0.1.0/components/OrderItemsList.jsx` | 57 | Implement chat functionality |
| `budolshap-0.1.0/components/CategoryIcons.jsx` | 17, 393 | Remove legacy API |
| `budolshap-0.1.0/components/auth/MathCaptcha.jsx` | 8 | Add refresh button |
| `documentation/docs_manifest.js` | 10 | Re-run on new docs |

---

## Remediation Priority

### Immediate (Week 1)
1. Rotate ALL exposed secrets (CRIT-001, CRIT-002, CRIT-003, CRIT-004)
2. Remove `.env` files from git history
3. Remove/protect debug endpoint (CRIT-005)
4. Add auth to financial endpoints (HIGH-004)
5. Implement webhook signature verification (HIGH-002)
6. Fix XSS vulnerability (HIGH-001)
7. Remove password from login redirect (HIGH-005)

### Short-term (Week 2-3)
1. Fix CORS configuration (HIGH-003)
2. Fix cookie security (HIGH-008)
3. Add rate limiting (MED-001)
4. Reduce JWT expiration (MED-002)
5. Enable SSL verification (HIGH-006)
6. Sanitize logged data (MED-004)

### Medium-term (Month 1-2)
1. Enable CSP (MED-006)
2. Add security headers to all services (MED-008)
3. Add auth to WebSocket endpoint (MED-005)
4. Standardize Prisma/Express versions (CQ-004, CQ-005)
5. Delete duplicate files (CQ-001, CQ-002)
6. Add test infrastructure (CQ-006)

### Long-term (Month 2-3)
1. Implement comprehensive logging (Winston/Pino)
2. Add automated security scanning to CI/CD
3. Implement secrets management
4. Consolidate phone normalization logic (CQ-003)
5. Clean up temporary files and root-level scripts (CQ-009)

---

*Generated on 2026-06-02 as part of a comprehensive codebase audit using GitNexus code intelligence, Graphify knowledge graph, and manual security review.*
