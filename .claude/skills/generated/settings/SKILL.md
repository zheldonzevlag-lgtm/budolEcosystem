---
name: settings
description: "Skill for the Settings area of budolEcosystem. 20 symbols across 11 files."
---

# Settings

20 symbols | 11 files | Cohesion: 76%

## When to Use

- Working with code in `budolshap-0.1.0/`
- Understanding how clearSettingsCache, updateSystemSettings, updateSystemSettings work
- Modifying settings-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `budolshap-0.1.0/app/store/settings/page.jsx` | StoreSettings, fetchStoreInfo, convertImageToBase64, onSubmitHandler |
| `budolshap-0.1.0/lib/settings.js` | clearSettingsCache, updateSystemSettings |
| `budolshap-0.1.0/lib/services/systemSettingsService.js` | updateSystemSettings, getSystemSettings |
| `budolshap-0.1.0/app/api/system/settings/route.js` | PUT, GET |
| `budolshap-0.1.0/app/api/internal/system/settings/route.js` | PUT, GET |
| `budolshap-0.1.0/app/api/system/geocode/route.js` | GET, getComponent |
| `budolshap-0.1.0/app/api/dashboard/store/route.js` | GET, calculateEarnings |
| `budolshap-0.1.0/scripts/test_scripts/verify-prisma-fix.mjs` | verifyFix |
| `budolshap-0.1.0/app/api/force-socket/route.js` | GET |
| `budolshap-0.1.0/app/api/system/realtime/route.js` | PUT |

## Entry Points

Start here when exploring this area:

- **`clearSettingsCache`** (Function) — `budolshap-0.1.0/lib/settings.js:55`
- **`updateSystemSettings`** (Function) — `budolshap-0.1.0/lib/settings.js:219`
- **`updateSystemSettings`** (Function) — `budolshap-0.1.0/lib/services/systemSettingsService.js:16`
- **`GET`** (Function) — `budolshap-0.1.0/app/api/force-socket/route.js:5`
- **`PUT`** (Function) — `budolshap-0.1.0/app/api/system/settings/route.js:19`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `clearSettingsCache` | Function | `budolshap-0.1.0/lib/settings.js` | 55 |
| `updateSystemSettings` | Function | `budolshap-0.1.0/lib/settings.js` | 219 |
| `updateSystemSettings` | Function | `budolshap-0.1.0/lib/services/systemSettingsService.js` | 16 |
| `GET` | Function | `budolshap-0.1.0/app/api/force-socket/route.js` | 5 |
| `PUT` | Function | `budolshap-0.1.0/app/api/system/settings/route.js` | 19 |
| `PUT` | Function | `budolshap-0.1.0/app/api/system/realtime/route.js` | 19 |
| `PUT` | Function | `budolshap-0.1.0/app/api/internal/system/settings/route.js` | 23 |
| `getSystemSettings` | Function | `budolshap-0.1.0/lib/services/systemSettingsService.js` | 12 |
| `GET` | Function | `budolshap-0.1.0/app/api/system/settings/route.js` | 9 |
| `GET` | Function | `budolshap-0.1.0/app/api/system/geocode/route.js` | 9 |
| `getComponent` | Function | `budolshap-0.1.0/app/api/system/geocode/route.js` | 89 |
| `GET` | Function | `budolshap-0.1.0/app/api/dashboard/store/route.js` | 5 |
| `calculateEarnings` | Function | `budolshap-0.1.0/app/api/dashboard/store/route.js` | 57 |
| `GET` | Function | `budolshap-0.1.0/app/api/internal/system/settings/route.js` | 11 |
| `GET` | Function | `budolshap-0.1.0/app/api/dashboard/admin/escrow/route.js` | 7 |
| `StoreSettings` | Function | `budolshap-0.1.0/app/store/settings/page.jsx` | 12 |
| `fetchStoreInfo` | Function | `budolshap-0.1.0/app/store/settings/page.jsx` | 62 |
| `convertImageToBase64` | Function | `budolshap-0.1.0/app/store/settings/page.jsx` | 108 |
| `onSubmitHandler` | Function | `budolshap-0.1.0/app/store/settings/page.jsx` | 121 |
| `verifyFix` | Function | `budolshap-0.1.0/scripts/test_scripts/verify-prisma-fix.mjs` | 3 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `PUT → FindUnique` | cross_community | 6 |
| `PUT → FindUnique` | cross_community | 6 |
| `PUT → VerifyToken` | cross_community | 5 |
| `PUT → GetPusher` | cross_community | 5 |
| `PUT → VerifyToken` | cross_community | 5 |
| `PUT → GetPusher` | cross_community | 5 |
| `GET → FindUnique` | cross_community | 4 |
| `GET → FindUnique` | cross_community | 4 |
| `GET → FindUnique` | cross_community | 4 |
| `PUT → HasPermission` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Test_scripts_2 | 3 calls |
| Categories | 3 calls |
| Services | 1 calls |
| Coupons | 1 calls |
| Components | 1 calls |

## How to Explore

1. `gitnexus_context({name: "clearSettingsCache"})` — see callers and callees
2. `gitnexus_query({query: "settings"})` — find related execution flows
3. Read key files listed above for implementation details
