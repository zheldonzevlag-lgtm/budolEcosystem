# Implementation Plan - Emergency Revert (v16.1)

## Phase 0: Baseline & Risk Analysis
- **Status**: Critical failure in product visibility and login SSO.
- **Risk**: Inconsistent data between new RDS and original production instance.
- **Action**: Immediate revert to original known-good RDS (`budol-db-production`).

## Phase 1: Data Recovery
- Point `DATABASE_URL` back to original production endpoint.
- Use confirmed database name: `budolshap_1db`.
- Isolate SSO database to `budolid` dedicated secret.

## Phase 2: App Tier Recovery
- Rebuild BudolID (`budol-id:v15`) with startup Prisma client generation.
- Force redeploy of both Store and Identity services.

## Phase 3: Verification
- Monitor ECS task health.
- Verify `GET /login` success in logs.
- Visual confirmation of products in browser.
