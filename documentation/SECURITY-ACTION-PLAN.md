# budolEcosystem — Security Hardening Action Plan

**Date:** June 6, 2026  
**Based on:** Security Audit Report (SECURITY-AUDIT-REPORT.md)  
**Priority:** IMMEDIATE — Financial system with active vulnerabilities

---

## Phase 1: CRITICAL — Immediate (Days 1-3)

> **Impact Note:** Phase 1 fixes the most dangerous vulnerabilities. These changes will require updating all `.env` files across the ecosystem and rotating all exposed secrets. Expect 2-4 hours of downtime for secret rotation.

### 1.1 Remove All Hardcoded Secrets (VULN-01, 06, 07, 18, 19, 20, 21)

**Action:**
- Remove ALL hardcoded fallback values from source code
- Require `JWT_SECRET` to be set — crash on startup if missing
- Rotate ALL exposed secrets immediately (JWT, DB passwords, Cloudinary, PayMongo, Lalamove, Pusher, Prisma API keys)

**Files to modify:**
```
budolID-0.1.0/index.js                    — Remove JWT_SECRET || fallback
budolpay-0.1.0/services/auth-service/index.js    — Remove JWT_SECRET || fallback
budolpay-0.1.0/services/api-gateway/index.js     — Remove JWT_SECRET || fallback, Pusher fallbacks, Vercel bypass token
budolshap-0.1.0/scripts/test_scripts/upload_logo_to_cloudinary.js — Remove hardcoded Cloudinary creds
budolID-0.1.0/index.js:37-45                      — Remove hardcoded API keys, use env vars
budolID-0.1.0/seed_user.js                        — Remove hardcoded password
budolpay-0.1.0/apps/admin/create_admin.js         — Remove hardcoded password
```

**Code change pattern:**
```js
// BEFORE (insecure)
const JWT_SECRET = process.env.JWT_SECRET || 'GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc=';

// AFTER (secure)
if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is required');
    process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;
```

**Verification:**
- `grep -r "|| '" --include="*.js" budolID-0.1.0/ budolpay-0.1.0/` should return no hardcoded secrets
- App crashes if JWT_SECRET is not set

---

### 1.2 Fix Wallet Service Authentication Bypass (VULN-03, 04, 31)

**Action:** Remove the `x-bypass-auth` header bypass and remove `/update-balance` and `/process-qr` from the unauthenticated list.

**File:** `budolpay-0.1.0/services/wallet-service/index.js`

```js
// BEFORE (insecure)
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

// AFTER (secure)
app.use((req, res, next) => {
    if (req.path.endsWith('/health')) {
        return next();
    }
    verifyToken(req, res, next);
});
```

**Add authorization to `/update-balance`:**
```js
router.post('/update-balance', verifyToken, requireRole('ADMIN'), async (req, res) => {
    // Only admins can update balances
    // Add amount limits, audit logging
});
```

**Verification:**
- `curl -X POST http://localhost:8002/update-balance -H "x-bypass-auth: true" ...` returns 401
- `curl -X POST http://localhost:8002/update-balance` (no auth) returns 401

---

### 1.3 Fix API Gateway Auth Bypass (VULN-02, 08)

**Action:** Remove the development mode bypass entirely. Never allow NODE_ENV-based auth bypass in production code.

**File:** `budolpay-0.1.0/services/api-gateway/index.js`

```js
// BEFORE (insecure)
const verifyToken = (req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        // ... decode but still next()
        return next();
    }
    // production auth...
};

// AFTER (secure)
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
```

**Also fix token fall-through (VULN-08):**
```js
// BEFORE (insecure)
} catch (err) {
    next(); // Passes invalid tokens through
}

// AFTER (secure)
} catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
}
```

**Verification:**
- Requests without token return 401
- Requests with invalid token return 401
- Requests with valid token proceed normally

---

### 1.4 Fix Transaction Service Auth (VULN-09)

**Action:** Uncomment the `verifyToken` middleware.

**File:** `budolpay-0.1.0/services/transaction-service/index.js`

```js
// BEFORE (insecure)
// app.use(verifyToken);

// AFTER (secure)
app.use(verifyToken);
```

**Verification:**
- `curl http://localhost:8003/transfer` (no auth) returns 401

---

### 1.5 Fix CORS Configuration (VULN-05)

**Action:** Replace wildcard CORS with explicit allowed origins.

**File:** `budolpay-0.1.0/services/api-gateway/index.js`

```js
// BEFORE (insecure)
app.use(cors({
    origin: '*',
    credentials: true
}));

// AFTER (secure)
const ALLOWED_ORIGINS = [
    process.env.NEXT_PUBLIC_APP_URL,       // e.g., https://budolpay.budol.duckdns.org
    process.env.NEXT_PUBLIC_BASE_URL,      // e.g., https://budolshap.budol.duckdns.org
    'http://localhost:3000',               // Local dev only
    'http://localhost:3001',               // Admin dashboard local
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

**Same for WebSocket server** (`websocket-server/server.js`).

**Verification:**
- `curl -H "Origin: https://evil.com" http://localhost:8000/` — CORS header absent
- `curl -H "Origin: https://budolpay.budol.duckdns.org" http://localhost:8000/` — CORS header present

---

## Phase 2: HIGH — Urgent (Days 4-7)

> **Impact Note:** Phase 2 adds security layers that may affect development workflows. Rate limiting should be tested thoroughly to avoid blocking legitimate users. WebSocket auth changes will require client-side updates.

### 2.1 Add Rate Limiting (VULN-14, 15)

**Action:** Install `express-rate-limit` and apply to all sensitive endpoints.

```bash
npm install express-rate-limit
```

**Apply to all services:**
```js
const rateLimit = require('express-rate-limit');

// Login: 5 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Too many login attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// OTP verification: 3 attempts per 5 minutes per IP
const otpLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 3,
    message: { error: 'Too many OTP attempts. Please request a new code.' },
});

// Financial operations: 10 per minute per user
const financialLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    keyGenerator: (req) => req.user?.userId || req.ip,
    message: { error: 'Too many requests. Please slow down.' },
});

app.post('/auth/sso/login', loginLimiter, loginHandler);
app.post('/verify-otp', otpLimiter, otpHandler);
app.post('/update-balance', financialLimiter, updateBalanceHandler);
app.post('/transfer', financialLimiter, transferHandler);
```

**Impact on system:** Legitimate users doing more than 5 login attempts in 15 minutes will be temporarily blocked. This is standard security practice. Financial rate limits prevent abuse while allowing normal transaction volumes.

**Verification:**
- Send 6 login attempts rapidly — 6th returns 429
- Normal login flow works unaffected

---

### 2.2 Add WebSocket Authentication (VULN-10, 11)

**Action:** Require JWT token for WebSocket connections and `/trigger` endpoint.

**File:** `websocket-server/server.js`

```js
// BEFORE (insecure)
io.on('connection', (socket) => {
    socket.on('subscribe', (channelName) => {
        socket.join(channelName);
    });
});

// AFTER (secure)
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.user = decoded;
        next();
    } catch (err) {
        next(new Error('Invalid token'));
    }
});

io.on('connection', (socket) => {
    socket.on('subscribe', (channelName) => {
        // Users can only subscribe to their own channels
        if (channelName === `user:${socket.user.userId}` || 
            socket.user.role === 'ADMIN') {
            socket.join(channelName);
        }
    });
});

// Protect /trigger endpoint
app.post('/trigger', verifyInternalAuth, (req, res) => {
    // Only internal services can trigger events
});
```

**Impact on system:** All WebSocket clients must pass a JWT token during connection. Mobile app and web frontend need to send `socket.auth = { token: jwtToken }` when connecting.

**Client-side change:**
```js
const socket = io('ws://localhost:4000', {
    auth: { token: localStorage.getItem('jwt_token') }
});
```

**Verification:**
- WebSocket connection without token is rejected
- Users can only join their own channel rooms

---

### 2.3 Remove Debug Endpoint (VULN-12)

**Action:** Delete or protect the `/debug/db-columns` endpoint.

**File:** `budolpay-0.1.0/services/auth-service/index.js`

```js
// DELETE or comment out entirely:
// app.get('/debug/db-columns', ...);

// OR protect with admin-only auth + remove DATABASE_URL from response:
app.get('/debug/db-columns', verifyToken, requireRole('ADMIN'), async (req, res) => {
    const result = await prisma.$queryRaw`...`;
    res.json({ columns: result }); // Do NOT include url
});
```

---

### 2.4 Fix XSS Vulnerabilities (VULN-13)

**Action:** HTML-escape all user input before interpolation.

**File:** `budolID-0.1.0/index.js`

```js
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Use escapeHtml() for all interpolated values:
value="${escapeHtml(activeApiKey)}"
value="${escapeHtml(preservedEmail)}"
```

**Also fix VULN-16:** Remove password from error redirect:
```js
// BEFORE (insecure)
return res.redirect(`/login?...&password=${encodeURIComponent(password)}`);

// AFTER (secure)
return res.redirect(`/login?...&error=1&email=${encodeURIComponent(email)}`);
// Never pass password in URL
```

---

### 2.5 Protect SSO App Info Endpoint (VULN-17)

**File:** `budolpay-0.1.0/services/auth-service/index.js`

```js
// BEFORE (insecure)
router.get('/sso/app-info', async (req, res) => {
    res.json(ecosystemApp); // Returns apiSecret
});

// AFTER (secure)
router.get('/sso/app-info', async (req, res) => {
    const { apiKey } = req.query;
    const ecosystemApp = await prisma.ecosystemApp.findUnique({ 
        where: { apiKey },
        select: { id: true, name: true, apiKey: true, redirectUrl: true }
        // Excludes apiSecret
    });
    res.json(ecosystemApp);
});
```

---

### 2.6 Add Security Headers to All Services (VULN-27)

**Action:** Add `helmet` middleware to all Express services.

```bash
npm install helmet
```

```js
const helmet = require('helmet');

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        }
    },
    hsts: { maxAge: 31536000, includeSubDomains: true },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
```

**Apply to:** `budolID-0.1.0/index.js`, `budolpay-0.1.0/services/auth-service/index.js`, `budolpay-0.1.0/services/wallet-service/index.js`, `websocket-server/server.js`

---

### 2.7 Add JWT Token Revocation (VULN-28)

**Action:** Implement a token blacklist using Redis or a database table.

```js
// Option A: Redis blacklist (recommended)
const redis = require('redis');
const blacklistClient = redis.createClient();

// On logout or password change:
await blacklistClient.set(`bl:${tokenHash}`, '1', 'EX', 30 * 24 * 60 * 60);

// In verifyToken middleware:
const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
const isBlacklisted = await blacklistClient.get(`bl:${tokenHash}`);
if (isBlacklisted) return res.status(401).json({ error: 'Token revoked' });
```

**Also reduce expiry:**
```js
// Mobile: 7 days instead of 30
const token = jwt.sign({...}, JWT_SECRET, { expiresIn: '7d' });

// SSO: 1 day instead of 7
const token = jwt.sign({...}, JWT_SECRET, { expiresIn: '1d' });
```

---

## Phase 3: MEDIUM — Important (Days 8-14)

> **Impact Note:** Phase 3 improves defense-in-depth. Changes are lower risk but should still be tested.

### 3.1 Fix Client-Side CAPTCHA (VULN-22)

**Action:** Replace client-side math CAPTCHA with server-side CAPTCHA (reCAPTCHA or hCaptcha).

```js
// Add reCAPTCHA verification on server
app.post('/auth/sso/register', async (req, res) => {
    const { captchaToken, ...userData } = req.body;
    
    const captchaVerified = await verifyCaptcha(captchaToken);
    if (!captchaVerified) {
        return res.status(400).json({ error: 'CAPTCHA verification failed' });
    }
    
    // Proceed with registration...
});
```

---

### 3.2 Sanitize Error Responses (VULN-23)

**Action:** Create a centralized error handler that strips internal details.

```js
function globalErrorHandler(err, req, res, next) {
    console.error(`[ERROR] ${err.message}`, err.stack); // Log full error server-side
    
    // Never expose stack traces or internal errors to client
    const safeMessage = {
        ValidationError: err.message,
        BadRequestError: err.message,
    }[err.name] || 'An unexpected error occurred';
    
    res.status(err.status || 500).json({
        error: err.name || 'InternalServerError',
        message: safeMessage,
    });
}
```

---

### 3.3 Add CSRF Protection for SSO Login Form (VULN-26)

```bash
npm install csurf
```

```js
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

// Apply to form-based routes only
app.get('/login', csrfProtection, (req, res) => {
    res.render('login', { csrfToken: req.csrfToken() });
});
app.post('/auth/sso/login-form', csrfProtection, loginHandler);
```

---

### 3.4 Fix Open Redirect (VULN-29)

**File:** `budolID-0.1.0/index.js`

```js
// BEFORE (insecure — too broad)
if (requestedHostname.endsWith('.vercel.app') ||
    requestedHostname.startsWith('192.168.')) {

// AFTER (secure — strict whitelist)
const ALLOWED_REDIRECT_HOSTNAMES = [
    'budolpay.budol.duckdns.org',
    'budolshap.budol.duckdns.org',
    'localhost',
];
if (ALLOWED_REDIRECT_HOSTNAMES.includes(requestedHostname)) {
```

---

### 3.5 Docker Security (VULN-25, 33)

**Action:** Add non-root user to all Dockerfiles.

```dockerfile
# Add before CMD
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser
```

**Update WebSocket Dockerfile to Node.js 20:**
```dockerfile
FROM node:20-alpine
```

---

### 3.6 Fix SQL Interpolation (VULN-30)

**File:** `scripts/test_scripts/fix-admin-id.js`

```js
// BEFORE (insecure)
await prisma.$executeRawUnsafe(`UPDATE "Order" SET "userId" = '${newId}' WHERE "userId" = '${oldId}'`);

// AFTER (secure)
await prisma.$executeRawUnsafe(
    'UPDATE "Order" SET "userId" = $1 WHERE "userId" = $2',
    newId, oldId
);
```

---

### 3.7 Add Input Validation on Financial Endpoints (VULN-32)

```bash
npm install joi
```

```js
const Joi = require('joi');

const updateBalanceSchema = Joi.object({
    userId: Joi.string().uuid().required(),
    amount: Joi.number().positive().max(1000000).required(),
    type: Joi.string().valid('add', 'subtract').required(),
});

router.post('/update-balance', verifyToken, requireRole('ADMIN'), async (req, res) => {
    const { error, value } = updateBalanceSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    // Proceed with validated value
});
```

---

### 3.8 Consolidate .env Files (All .env exposure issues)

**Action:** 
1. Delete all `.env.*` variant files from the repository
2. Create a single `.env.example` with placeholder values
3. Update `.gitignore` to cover ALL `.env` patterns:

```gitignore
# .env files (comprehensive)
.env
.env.*
!.env.example
!.env.template
```

4. Use a secrets manager (Vercel Environment Variables, AWS SSM, or HashiCorp Vault) for production secrets
5. Never commit actual `.env` files — only `.env.example`

---

## Phase 4: LOW — Best Practice (Days 15-21)

### 4.1 Fix PII in Seed Scripts (VULN-34)
Replace real emails/phones with test data:
```js
const email = 'test-admin@example.com';
phoneNumber: '09000000000'
```

### 4.2 Upgrade WebSocket to Node.js 20 (VULN-33)
Update `websocket-server/Dockerfile` to `FROM node:20-alpine`.

---

## Implementation Order & Dependencies

```
Phase 1 (Days 1-3) — MUST complete first
├── 1.1 Remove hardcoded secrets (blocks everything else)
├── 1.2 Fix wallet auth bypass (CRITICAL financial risk)
├── 1.3 Fix API gateway auth (CRITICAL — affects all services)
├── 1.4 Fix transaction auth (HIGH — financial risk)
└── 1.5 Fix CORS (enables safe frontend communication)

Phase 2 (Days 4-7) — Depends on Phase 1
├── 2.1 Rate limiting (needs 1.3 fixed first)
├── 2.2 WebSocket auth (needs JWT infrastructure from 1.1)
├── 2.3 Remove debug endpoint (independent)
├── 2.4 Fix XSS (independent)
├── 2.5 Fix SSO info leak (independent)
├── 2.6 Security headers (independent)
└── 2.7 JWT revocation (needs 1.1 fixed first)

Phase 3 (Days 8-14) — Depends on Phase 2
├── 3.1-3.8 All independent improvements

Phase 4 (Days 15-21) — Best practices
└── 4.1-4.2 Cosmetic improvements
```

---

## Testing Checklist

After each phase, verify:

- [ ] All services start without hardcoded secrets (crash if env vars missing)
- [ ] Unauthenticated requests to protected endpoints return 401
- [ ] `x-bypass-auth` header has no effect
- [ ] CORS blocks requests from unauthorized origins
- [ ] Rate limiting triggers at configured thresholds
- [ ] WebSocket connections require valid JWT
- [ ] Error responses don't leak stack traces
- [ ] Security headers present in HTTP responses
- [ ] No `.env` files with real secrets in git history
- [ ] Financial endpoints validate input schemas
- [ ] XSS payloads in query params are escaped in HTML
- [ ] Login redirect no longer includes password

---

## Rollback Plan

If any fix causes production issues:

1. **Phase 1 secret rotation:** Keep old secrets as backup, add new ones first, then remove old
2. **Auth changes:** Feature-flag new auth middleware, disable via env var if needed
3. **Rate limiting:** Use gradual rollout — start with high limits, reduce over time
4. **CORS:** Add new origins to whitelist before removing wildcard

---

## Risk Assessment of Fixes

| Fix | Risk of Breaking | Mitigation |
|-----|-----------------|------------|
| Remove hardcoded secrets | LOW — just set env vars | Test with all services |
| Fix wallet auth bypass | MEDIUM — removes debug access | Ensure admin endpoints still work with real auth |
| Fix API gateway auth | HIGH — all services depend on it | Test thoroughly with all microservices |
| Fix CORS | MEDIUM — may break frontend | Update allowed origins before deploying |
| Add rate limiting | LOW — generous limits initially | Monitor 429 rates, adjust thresholds |
| WebSocket auth | MEDIUM — requires client changes | Deploy client changes simultaneously |
| Security headers | LOW — standard practice | Test for CSP breakage on frontend |

---
