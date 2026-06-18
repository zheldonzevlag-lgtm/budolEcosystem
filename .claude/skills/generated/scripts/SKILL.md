---
name: scripts
description: "Skill for the Scripts area of budolEcosystem. 27 symbols across 17 files."
---

# Scripts

27 symbols | 17 files | Cohesion: 78%

## When to Use

- Working with code in `budolshap-0.1.0/`
- Understanding how cleanupExpiredSessions, init work
- Modifying scripts-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `budolpay-0.1.0/apps/admin/lib/realtime.ts` | setWsConnected, connect, connectSocketIO, disconnect |
| `budolshap-0.1.0/scripts/restore-to-vercel.js` | parseSqlFile, executeCopyBlock, restore |
| `budolshap-0.1.0/scripts/transfer-to-vercel.js` | transferTable, main |
| `budolshap-0.1.0/scripts/cleanup-expired-checkouts.js` | runCleanup, getCleanupStats |
| `budolshap-0.1.0/lib/services/checkoutService.js` | restoreStockForExpiredCheckout, cleanupExpiredSessions |
| `scripts/network-util.js` | getLocalIP, updateNetworkConfig |
| `budolshap-0.1.0/scripts/test_cart_persistence.mjs` | findBaseUrl, runTest |
| `init_rds_schemas.js` | init |
| `check_restored_db.js` | check |
| `check_db_direct.mjs` | check |

## Entry Points

Start here when exploring this area:

- **`cleanupExpiredSessions`** (Function) — `budolshap-0.1.0/lib/services/checkoutService.js:281`
- **`init`** (Method) — `budolPayMobile/lib/services/pusher_service.dart:18`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `cleanupExpiredSessions` | Function | `budolshap-0.1.0/lib/services/checkoutService.js` | 281 |
| `init` | Method | `budolPayMobile/lib/services/pusher_service.dart` | 18 |
| `init` | Function | `init_rds_schemas.js` | 3 |
| `check` | Function | `check_restored_db.js` | 6 |
| `check` | Function | `check_db_direct.mjs` | 5 |
| `transferTable` | Function | `budolshap-0.1.0/scripts/transfer-to-vercel.js` | 64 |
| `main` | Function | `budolshap-0.1.0/scripts/transfer-to-vercel.js` | 131 |
| `parseSqlFile` | Function | `budolshap-0.1.0/scripts/restore-to-vercel.js` | 19 |
| `executeCopyBlock` | Function | `budolshap-0.1.0/scripts/restore-to-vercel.js` | 64 |
| `restore` | Function | `budolshap-0.1.0/scripts/restore-to-vercel.js` | 99 |
| `main` | Function | `budolshap-0.1.0/scripts/restore-ecosystem-vercel.js` | 8 |
| `main` | Function | `budolshap-0.1.0/scripts/manual-data-sync.js` | 8 |
| `main` | Function | `budolshap-0.1.0/scripts/init-vercel-schema.js` | 7 |
| `check` | Function | `budolshap-0.1.0/scripts/check-vercel-schemas.js` | 5 |
| `main` | Function | `budolshap-0.1.0/scripts/auto-migrate-vercel.js` | 7 |
| `setupDatabase` | Function | `budolshap-0.1.0/scripts/test_scripts/setup-database.js` | 2 |
| `runCleanup` | Function | `budolshap-0.1.0/scripts/cleanup-expired-checkouts.js` | 11 |
| `getCleanupStats` | Function | `budolshap-0.1.0/scripts/cleanup-expired-checkouts.js` | 43 |
| `restoreStockForExpiredCheckout` | Function | `budolshap-0.1.0/lib/services/checkoutService.js` | 222 |
| `getLocalIP` | Function | `scripts/network-util.js` | 8 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Bootstrap → _onWsStatusChange` | cross_community | 6 |
| `Bootstrap → Reinit` | cross_community | 6 |
| `Bootstrap → Emit` | cross_community | 6 |
| `POST → FindMany` | cross_community | 5 |
| `POST → FindUnique` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| BudolPay | 4 calls |
| Test_scripts_2 | 2 calls |

## How to Explore

1. `gitnexus_context({name: "cleanupExpiredSessions"})` — see callers and callees
2. `gitnexus_query({query: "scripts"})` — find related execution flows
3. Read key files listed above for implementation details
