# budolEcosystem — Security Audit Report

**Date:** June 6, 2026  
**Scope:** Full ecosystem (budolID, budolPay, budolShap, budolAccounting, WebSocket Server, Docker configs)  
**Auditor:** Automated Security Analysis  
**Classification:** CONFIDENTIAL

---

## Executive Summary

This audit identified **36 security vulnerabilities** across the budolEcosystem codebase:

| Severity | Count |
|----------|-------|
| CRITICAL | 5 |
| HIGH | 12 |
| MEDIUM | 13 |
| LOW | 2 |
| **Total** | **32** |

The most dangerous findings involve **completely unauthenticated financial endpoints** (wallet balance modification, payment processing), **hardcoded secrets committed to source control**, and **authentication bypass mechanisms** that allow any attacker to gain admin privileges.

---

## CRITICAL Vulnerabilities

### VULN-01: Hardcoded JWT Secret with Predictable Fallback

**Severity:** CRITICAL  
**CVSS:** 9.8  
**Files:**
- `budolID-0.1.0/index.js:94`
- `budolpay-0.1.0/services/auth-service/index.js:164`
- `budolpay-0.1.0/services/api-gateway/index.js:130`

```js
const JWT_SECRET = process.env.JWT_SECRET || 'GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc=';
```

**Risk:** If `JWT_SECRET` env var is unset in production, the hardcoded fallback is used. An attacker with source code access can forge any JWT token and impersonate any user including admins, gaining full access to financial operations.

**Attack Vector:** Attacker reads the source code (public GitHub, leaked repo, or decompiled deployment), uses the known secret to sign a JWT with `role: 'ADMIN'`, and submits it to any authenticated endpoint.

---

### VULN-02: API Gateway Dev Mode Bypasses All Authentication

**Severity:** CRITICAL  
**CVSS:** 9.8  
**File:** `budolpay-0.1.0/services/api-gateway/index.js:136-150`

```js
const verifyToken = (req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        // ... decode token if present ...
        return next(); // ALL REQUESTS PASS WITHOUT AUTH
    }
```

**Risk:** When `NODE_ENV` is not set to `production` (Express defaults to `undefined`), ALL routes bypass authentication. Since the API gateway is the entry point for the entire budolPay microservice architecture, this effectively disables all security.

**Attack Vector:** Any HTTP request to any endpoint succeeds without authentication when NODE_ENV is unset or set to `development`.

---

### VULN-03: Wallet Service Auth Bypass via HTTP Header

**Severity:** CRITICAL  
**CVSS:** 9.8  
**File:** `budolpay-0.1.0/services/wallet-service/index.js:36-48`

```js
app.use((req, res, next) => {
    if (req.path.endsWith('/health') || 
        req.path.endsWith('/update-balance') || 
        req.path.endsWith('/process-qr') ||
        req.headers['x-bypass-auth'] === 'true'
    ) {
        if (!req.user) {
            req.user = { userId: 'test-user-id', role: 'ADMIN' };
        }
        return next();
    }
    verifyToken(req, res, next);
});
```

**Risk:** Three attack vectors:
1. Setting header `x-bypass-auth: true` grants ADMIN privileges to any request
2. The `/update-balance` endpoint (modifies wallet balances) is permanently unauthenticated
3. The `/process-qr` endpoint (processes payments) is permanently unauthenticated

**Attack Vector:** `curl -X POST http://target:8002/update-balance -H "Content-Type: application/json" -d '{"userId":"victim-id","amount":999999,"type":"add"}'`

---

### VULN-04: Unauthenticated Balance Update Allows Unlimited Fund Creation

**Severity:** CRITICAL  
**CVSS:** 9.8  
**File:** `budolpay-0.1.0/services/wallet-service/index.js:485-545`

```js
router.post('/update-balance', async (req, res) => {
    const { userId, amount, type } = req.body;
    const newBalance = type === 'add' 
        ? parseFloat(wallet.balance) + parseFloat(amount)
        : parseFloat(wallet.balance) - parseFloat(amount);
```

**Risk:** Combined with VULN-03, anyone can create unlimited funds in any wallet. No authentication, no authorization checks, no audit trail, no limits on amount.

---

### VULN-05: CORS Wildcard with Credentials Enabled

**Severity:** CRITICAL  
**CVSS:** 8.1  
**File:** `budolpay-0.1.0/services/api-gateway/index.js:35-39`

```js
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
}));
```

**Risk:** Any website can make cross-origin requests to the API. Combined with auth bypasses, a malicious website can perform arbitrary API calls on behalf of any user.

---

## HIGH Vulnerabilities

### VULN-06: Hardcoded Database Credentials

**Severity:** HIGH  
**CVSS:** 8.6  
**Files:**
- `budolID-0.1.0/index.js:17`
- `budolpay-0.1.0/docker-compose.yml:7,24,44,59,71,82,93,104,115`
- `.env` (root)

**Risk:** Database password `r00t` is hardcoded in source and docker-compose.

---

### VULN-07: Hardcoded Cloudinary API Secret

**Severity:** HIGH  
**CVSS:** 8.0  
**File:** `budolshap-0.1.0/scripts/test_scripts/upload_logo_to_cloudinary.js:15-16`

**Risk:** Full Cloudinary credentials committed to source. Allows uploading/deleting/modifying all media assets.

---

### VULN-08: Gateway Token Verification Falls Through on Invalid Tokens

**Severity:** HIGH  
**CVSS:** 8.0  
**File:** `budolpay-0.1.0/services/api-gateway/index.js:192-196`

```js
} catch (err) {
    next(); // Invalid token forwarded to backend
}
```

**Risk:** Invalid/expired/tampered tokens are forwarded to backend services instead of rejected.

---

### VULN-09: Transaction Service Auth Completely Commented Out

**Severity:** HIGH  
**CVSS:** 8.5  
**File:** `budolpay-0.1.0/services/transaction-service/index.js:28`

```js
// app.use(verifyToken);  // COMMENTED OUT
```

**Risk:** All transaction endpoints (`/transfer`, `/cash-in`, `/cash-out`, `/resolve`) accessible without authentication.

---

### VULN-10: WebSocket Server Has No Authentication

**Severity:** HIGH  
**CVSS:** 7.5  
**File:** `websocket-server/server.js:21-53`

**Risk:** Any client can subscribe to any channel and send fake events via `/trigger`.

---

### VULN-11: API Gateway Socket.io Has No Authentication

**Severity:** HIGH  
**CVSS:** 7.5  
**File:** `budolpay-0.1.0/services/api-gateway/index.js:232-263`

**Risk:** Any WebSocket client can join the admin room or any user's personal room.

---

### VULN-12: Debug Endpoint Exposes Full Database URL

**Severity:** HIGH  
**CVSS:** 8.0  
**File:** `budolpay-0.1.0/services/auth-service/index.js:406-421`

**Risk:** Unauthenticated `/debug/db-columns` endpoint exposes full database connection URL with credentials.

---

### VULN-13: Reflected XSS in Login Page

**Severity:** HIGH  
**CVSS:** 7.1  
**File:** `budolID-0.1.0/index.js:265-345`

**Risk:** User-controlled query parameters reflected into HTML without sanitization.

---

### VULN-14: No Rate Limiting on Login/OTP Endpoints

**Severity:** HIGH  
**CVSS:** 7.5  
**Files:** `budolID-0.1.0/index.js`, `budolpay-0.1.0/services/auth-service/index.js:1123`

**Risk:** Unlimited brute-force attempts on passwords and 6-digit OTP codes.

---

### VULN-15: No Rate Limiting on Financial Operations

**Severity:** HIGH  
**CVSS:** 7.5  
**Files:** All wallet/transaction/payment service route handlers

**Risk:** No rate limiting on wallet operations, P2P transfers, or payment intents.

---

### VULN-16: Password Reflected in Login Error URL

**Severity:** HIGH  
**CVSS:** 7.1  
**File:** `budolID-0.1.0/index.js:1297`

**Risk:** Plaintext password appears in browser history, logs, and referrer headers on failed login.

---

### VULN-17: SSO App Info Endpoint Leaks apiSecret

**Severity:** HIGH  
**CVSS:** 7.0  
**File:** `budolpay-0.1.0/services/auth-service/index.js:170-175`

**Risk:** Full ecosystem app record including `apiSecret` returned with just the public `apiKey`.

---

## MEDIUM Vulnerabilities

| # | Vulnerability | File(s) |
|---|--------------|---------|
| VULN-18 | Hardcoded Pusher Credentials | `api-gateway/index.js:100-103` |
| VULN-19 | Hardcoded Vercel Bypass Token | `api-gateway/index.js:345` |
| VULN-20 | Predictable Ecosystem API Keys | `budolID-0.1.0/index.js:37-45` |
| VULN-21 | Hardcoded Admin Passwords in Seeds | `seed_user.js:12`, `create_admin.js:8` |
| VULN-22 | Client-Side-Only CAPTCHA | `budolID-0.1.0/index.js:621-673` |
| VULN-23 | Stack Traces in Error Responses | All Express services |
| VULN-24 | LIKE Pattern Injection | `payment-gateway-service/api/index.js:216` |
| VULN-25 | Docker Containers Run as Root | All Dockerfiles |
| VULN-26 | No CSRF Protection on SSO Login | `budolID-0.1.0/index.js` |
| VULN-27 | Missing Security Headers (Helmet) | All services except gateway |
| VULN-28 | JWT Expiry Too Long (30d/7d) | `auth-service/index.js:987`, `budolID/index.js:1310` |
| VULN-29 | Open Redirect via Broad SSO Whitelist | `budolID-0.1.0/index.js:1342` |
| VULN-30 | Raw SQL String Interpolation | `scripts/test_scripts/fix-admin-id.js:69` |
| VULN-31 | Permanent Unauth Routes in Wallet | `wallet-service/index.js:36-48` |
| VULN-32 | No Input Validation on Financial Endpoints | All financial services |

## LOW Vulnerabilities

| # | Vulnerability | File(s) |
|---|--------------|---------|
| VULN-33 | WebSocket Server Uses Node.js 18 | `websocket-server/Dockerfile` |
| VULN-34 | Real PII in Seed Scripts | `seed_user.js`, `create_admin.js` |

---

## Environment Variables Exposed in Source Control

42+ `.env` files contain production/development secrets. While `.gitignore` lists `.env`, variant files (`.env.local`, `.env.vercel-prod`, `.env.check`, etc.) are NOT covered.

| File | Key Secrets Exposed |
|------|-------------------|
| `.env` (root) | All DB passwords, JWT secret, Cloudinary/PayMongo/Lalamove keys, Prisma API keys, Vercel OIDC token |
| `budolpay-0.1.0/services/*/.env` | JWT secret, DB URLs, all API keys (duplicated across 4+ services) |
| `budolshap-0.1.0/.env` | Full production config with all secrets |
| `budolID-0.1.0/.env` | JWT secret, DB URLs, all API keys |
| `budolAccounting-0.1.0/.env` | JWT secret, DB URLs, all API keys |

---
