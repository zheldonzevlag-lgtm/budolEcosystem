---
name: categories
description: "Skill for the Categories area of budolEcosystem. 51 symbols across 28 files."
---

# Categories

51 symbols | 28 files | Cohesion: 75%

## When to Use

- Working with code in `budolshap-0.1.0/`
- Understanding how requireAdmin, getReturns, updateErrorTrackingConfig work
- Modifying categories-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `budolshap-0.1.0/app/admin/categories/page.jsx` | CategoryManagementPage, getIconByName, renderIcon, fetchCategories, handleSubmit (+9) |
| `budolshap-0.1.0/app/api/admin/categories/route.js` | GET, POST, PUT, DELETE |
| `budolshap-0.1.0/app/api/coupons/route.js` | GET, POST |
| `budolshap-0.1.0/app/api/coupons/[code]/route.js` | DELETE, PUT |
| `budolshap-0.1.0/app/api/admin/payouts/route.js` | GET, PUT |
| `budolshap-0.1.0/app/api/admin/memberships/route.js` | GET, POST |
| `budolshap-0.1.0/app/api/admin/kyc/route.js` | GET, PATCH |
| `budolshap-0.1.0/app/api/admin/stores/[id]/route.js` | PATCH, DELETE |
| `budolshap-0.1.0/app/api/admin/products/[id]/route.js` | PATCH, DELETE |
| `budolshap-0.1.0/lib/adminAuth.js` | requireAdmin |

## Entry Points

Start here when exploring this area:

- **`requireAdmin`** (Function) — `budolshap-0.1.0/lib/adminAuth.js:87`
- **`getReturns`** (Function) — `budolshap-0.1.0/lib/services/returnsService.js:40`
- **`updateErrorTrackingConfig`** (Function) — `budolshap-0.1.0/lib/services/errorTrackingService.js:50`
- **`updateTrustStatus`** (Function) — `budolshap-0.1.0/lib/api/budolIdClient.js:117`
- **`GET`** (Function) — `budolshap-0.1.0/app/api/coupons/route.js:5`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `requireAdmin` | Function | `budolshap-0.1.0/lib/adminAuth.js` | 87 |
| `getReturns` | Function | `budolshap-0.1.0/lib/services/returnsService.js` | 40 |
| `updateErrorTrackingConfig` | Function | `budolshap-0.1.0/lib/services/errorTrackingService.js` | 50 |
| `updateTrustStatus` | Function | `budolshap-0.1.0/lib/api/budolIdClient.js` | 117 |
| `GET` | Function | `budolshap-0.1.0/app/api/coupons/route.js` | 5 |
| `POST` | Function | `budolshap-0.1.0/app/api/coupons/route.js` | 59 |
| `PUT` | Function | `budolshap-0.1.0/app/api/system/error-tracking/route.js` | 36 |
| `GET` | Function | `budolshap-0.1.0/app/api/dashboard/admin/route.js` | 5 |
| `DELETE` | Function | `budolshap-0.1.0/app/api/coupons/[code]/route.js` | 5 |
| `PUT` | Function | `budolshap-0.1.0/app/api/coupons/[code]/route.js` | 34 |
| `GET` | Function | `budolshap-0.1.0/app/api/admin/webhooks/route.js` | 6 |
| `GET` | Function | `budolshap-0.1.0/app/api/admin/stores/route.js` | 4 |
| `GET` | Function | `budolshap-0.1.0/app/api/admin/returns/route.js` | 10 |
| `GET` | Function | `budolshap-0.1.0/app/api/admin/products/route.js` | 5 |
| `GET` | Function | `budolshap-0.1.0/app/api/admin/payouts/route.js` | 4 |
| `PUT` | Function | `budolshap-0.1.0/app/api/admin/payouts/route.js` | 57 |
| `GET` | Function | `budolshap-0.1.0/app/api/admin/orders/route.js` | 5 |
| `GET` | Function | `budolshap-0.1.0/app/api/admin/memberships/route.js` | 5 |
| `POST` | Function | `budolshap-0.1.0/app/api/admin/memberships/route.js` | 62 |
| `GET` | Function | `budolshap-0.1.0/app/api/admin/marketing-ads/route.js` | 5 |

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
| Test_scripts_2 | 18 calls |
| Chats | 1 calls |
| V2 | 1 calls |
| Services | 1 calls |
| Components | 1 calls |

## How to Explore

1. `gitnexus_context({name: "requireAdmin"})` — see callers and callees
2. `gitnexus_query({query: "categories"})` — find related execution flows
3. Read key files listed above for implementation details
