# Secret Rotation Guide — budolEcosystem

**Last Updated:** June 6, 2026
**Status:** Active — all secrets replaced with secure versions

---

## Current Secret Inventory

| Secret | Location | Value (masked) | Notes |
|--------|----------|----------------|-------|
| BudolID API Key | Neon DB `budolpay.budolid` | `bp_b31ea...b7a` | Cryptographically generated |
| BudolShap API Key | Neon DB `budolpay.budolid` | `bs_ac2b...917` | Cryptographically generated |
| BudolPay Admin JWT_SECRET | Vercel env `budolpay-admin` | `JWT_SECRET` | Set via dashboard |
| BudolID JWT_SECRET | Vercel env `budolid` | `JWT_SECRET` | Independent secret |
| BudolShap JWT_SECRET | Vercel env `budolshap` | `JWT_SECRET` | Independent secret |
| PayMongo Secret Key | Vercel env (multiple) | `PAYMONGO_SECRET_KEY` | From .env.local |
| Neon DB Password | Vercel env + Neon dashboard | `DATABASE_URL` | Shared across services |
| Prisma Accelerate | Vercel env `budolpay-api-monolith` | `PRISMA_ACCELERATE_URL` | Connection pooling |

---

## Phase 1: Neon DB Password Rotation

**Priority:** HIGH  
**Downtime:** ~5 minutes (services reconnect automatically)

### Steps
1. Log into Neon dashboard → select `budolpay` project → Settings → Reset Password
2. Copy new connection string
3. Update `DATABASE_URL` in these Vercel projects:
   - `budolpay-admin` (Prisma uses this directly)
   - `budolpay-api-monolith` (Prisma Accelerate)
   - `budolaccounting` (if separate DB)
4. Redeploy each affected service
5. Verify: `curl https://budolpay-api-monolith.vercel.app/api/system/status`

---

## Phase 2: Unify JWT_SECRET Across Services

**Priority:** MEDIUM  
**Downtime:** None (if using rolling rotation)

### Current Problem
- `budolid`, `budolpay-admin`, and `budolshap` each generate **independent** JWT secrets
- Tokens from one service cannot be verified by another
- This is by design for now (SSO uses API key auth, not JWT verification)

### Recommended Approach
Keep secrets independent. SSO authentication uses API key exchange (budolID → budolPay), not cross-service JWT verification. Unifying JWT secrets would only matter if services needed to verify each other's tokens directly.

---

## Phase 3: API Key Rotation

**Priority:** HIGH  
**Downtime:** ~2 minutes (update env vars, redeploy)

### Steps
1. Generate new keys:
   ```bash
   node -e "console.log('bp_' + require('crypto').randomBytes(24).toString('hex'))"
   node -e "console.log('bs_' + require('crypto').randomBytes(24).toString('hex'))"
   ```
2. Update Neon DB `budolpay.budolid.ecosystem_apps` table
3. Update Vercel env vars:
   - `BUDOLID_SSO_API_KEY` in `budolpay-admin`
   - `NEXT_PUBLIC_BUDOLID_API_KEY` in `budolshap`
4. Update `budolID-0.1.0/seed-apps.cjs` with new keys
5. Redeploy budolpay-admin and budolshap
6. Verify SSO login flow

---

## Emergency: Revoke Access

If a key is compromised:

1. **Immediate:** Delete the row in `budolpay.budolid.ecosystem_apps`
2. **5 min:** Generate new key, update Neon DB + Vercel env vars
3. **10 min:** Redeploy affected services
4. **15 min:** Verify login flows

---

## Monitoring

- **Neon Dashboard:** Database connection count, query performance
- **Vercel Dashboard:** Deployment logs, function invocations
- **BudolID Logs:** Failed auth attempts (check rate limiter)
