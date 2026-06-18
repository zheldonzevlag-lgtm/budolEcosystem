---
name: v2
description: "Skill for the V2 area of budolEcosystem. 120 symbols across 20 files."
---

# V2

120 symbols | 20 files | Cohesion: 86%

## When to Use

- Working with code in `scripts/`
- Understanding how clearSettingsCache, triggerRealtimeEvent, getRealtimeConfig work
- Modifying v2-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `scripts/test_scripts/budolShap/v2/test-phase6.mjs` | logTest, testDatabaseConnection, testSchemaUpdate, testAuthServiceFile, testCacheServiceFile (+8) |
| `scripts/test_scripts/budolShap/v2/test-phase2-webhook.js` | logSection, logSuccess, logError, logInfo, logWarning (+8) |
| `scripts/test_scripts/budolShap/v2/test-phase2-production.js` | logSection, logSuccess, logError, logInfo, logWarning (+8) |
| `scripts/test_scripts/budolShap/v2/test-phase5.mjs` | logTest, testInternalShippingAPI, testShippingServiceFunctions, testPublicAPIConsistency, testShippingServiceIntegration (+5) |
| `scripts/test_scripts/budolShap/v2/test-phase3.mjs` | logTest, testInternalPaymentAPI, testPaymentServiceFunctions, testPublicAPIConsistency, testPaymentServiceIntegration (+5) |
| `scripts/test_scripts/budolShap/v2/test-phase4.mjs` | logTest, testDatabaseConnection, testOrdersServiceFile, testInternalOrdersAPI, testServiceInterfaces (+4) |
| `scripts/test_scripts/budolShap/v2/test-phase2.mjs` | logTest, testDatabaseConnection, testInternalAPIStructure, testServiceClient, testServiceInterfaces (+4) |
| `scripts/test_scripts/budolShap/v2/test-phase1.js` | setupDatabase, loadServices, testSystemSettingsService, testAPIRoutes, runAllTests (+4) |
| `scripts/test_scripts/budolShap/v2/test-phase1.mjs` | logTest, testDatabaseConnection, testSystemSettingsDirect, testServiceLayerStructure, testAPIRoutes (+2) |
| `budolshap-0.1.0/lib/realtime.js` | clearSettingsCache, getSettings, getPusher, triggerRealtimeEvent, getRealtimeConfig |

## Entry Points

Start here when exploring this area:

- **`clearSettingsCache`** (Function) — `budolshap-0.1.0/lib/realtime.js:13`
- **`triggerRealtimeEvent`** (Function) — `budolshap-0.1.0/lib/realtime.js:91`
- **`getRealtimeConfig`** (Function) — `budolshap-0.1.0/lib/realtime.js:180`
- **`createAuditLog`** (Function) — `budolshap-0.1.0/lib/audit.js:17`
- **`getHeader`** (Function) — `budolshap-0.1.0/lib/audit.js:26`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `clearSettingsCache` | Function | `budolshap-0.1.0/lib/realtime.js` | 13 |
| `triggerRealtimeEvent` | Function | `budolshap-0.1.0/lib/realtime.js` | 91 |
| `getRealtimeConfig` | Function | `budolshap-0.1.0/lib/realtime.js` | 180 |
| `createAuditLog` | Function | `budolshap-0.1.0/lib/audit.js` | 17 |
| `getHeader` | Function | `budolshap-0.1.0/lib/audit.js` | 26 |
| `logTest` | Function | `scripts/test_scripts/budolShap/v2/test-phase6.mjs` | 32 |
| `testDatabaseConnection` | Function | `scripts/test_scripts/budolShap/v2/test-phase6.mjs` | 43 |
| `testSchemaUpdate` | Function | `scripts/test_scripts/budolShap/v2/test-phase6.mjs` | 56 |
| `testAuthServiceFile` | Function | `scripts/test_scripts/budolShap/v2/test-phase6.mjs` | 85 |
| `testCacheServiceFile` | Function | `scripts/test_scripts/budolShap/v2/test-phase6.mjs` | 114 |
| `testInternalAuthAPI` | Function | `scripts/test_scripts/budolShap/v2/test-phase6.mjs` | 149 |
| `testInternalCacheAPI` | Function | `scripts/test_scripts/budolShap/v2/test-phase6.mjs` | 172 |
| `testCacheAPI` | Function | `scripts/test_scripts/budolShap/v2/test-phase6.mjs` | 192 |
| `testAdminCachePage` | Function | `scripts/test_scripts/budolShap/v2/test-phase6.mjs` | 201 |
| `testAdminSidebarUpdate` | Function | `scripts/test_scripts/budolShap/v2/test-phase6.mjs` | 210 |
| `testServiceInterfaces` | Function | `scripts/test_scripts/budolShap/v2/test-phase6.mjs` | 233 |
| `testInternalEndpoints` | Function | `scripts/test_scripts/budolShap/v2/test-phase6.mjs` | 258 |
| `runAllTests` | Function | `scripts/test_scripts/budolShap/v2/test-phase6.mjs` | 306 |
| `logSection` | Function | `scripts/test_scripts/budolShap/v2/test-phase2-webhook.js` | 39 |
| `logSuccess` | Function | `scripts/test_scripts/budolShap/v2/test-phase2-webhook.js` | 45 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `PUT → FindUnique` | cross_community | 6 |
| `POST → FindUnique` | cross_community | 6 |
| `GET → FindUnique` | cross_community | 6 |
| `DELETE → FindUnique` | cross_community | 6 |
| `GET → FindUnique` | cross_community | 6 |
| `GET → FindUnique` | cross_community | 6 |
| `GET → FindUnique` | cross_community | 6 |
| `POST → FindUnique` | cross_community | 6 |
| `POST → FindUnique` | cross_community | 6 |
| `GET → FindUnique` | cross_community | 6 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Test_scripts_2 | 6 calls |

## How to Explore

1. `gitnexus_context({name: "clearSettingsCache"})` — see callers and callees
2. `gitnexus_query({query: "v2"})` — find related execution flows
3. Read key files listed above for implementation details
