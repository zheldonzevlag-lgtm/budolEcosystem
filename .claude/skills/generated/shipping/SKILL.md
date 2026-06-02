---
name: shipping
description: "Skill for the Shipping area of budolEcosystem. 20 symbols across 14 files."
---

# Shipping

20 symbols | 14 files | Cohesion: 51%

## When to Use

- Working with code in `budolshap-0.1.0/`
- Understanding how verifyToken, verifyEmail, resetPassword work
- Modifying shipping-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `budolshap-0.1.0/app/api/store/shipping/route.js` | getAuthenticatedStore, GET, PUT |
| `budolshap-0.1.0/lib/services/authService.js` | verifyEmail, resetPassword |
| `budolshap-0.1.0/lib/shipping/shippingContract.js` | validateShippingData, updateShippingStatus |
| `budolshap-0.1.0/lib/shipping/featureFlags.js` | isBudolShapShippingEnabledServer, getBudolShapShippingSLADaysServer |
| `budolshap-0.1.0/app/api/orders/overdue-shipping/sweep/route.js` | POST, GET |
| `budolshap-0.1.0/lib/token.js` | verifyToken |
| `budolshap-0.1.0/app/api/auth/logout/route.js` | POST |
| `budolshap-0.1.0/app/api/orders/[orderId]/payment-proof/route.js` | POST |
| `budolshap-0.1.0/lib/shipping/statusMapper.js` | normalizeStatus |
| `scripts/test_scripts/budolShap/v2/test-sync.mjs` | main |

## Entry Points

Start here when exploring this area:

- **`verifyToken`** (Function) — `budolshap-0.1.0/lib/token.js:11`
- **`verifyEmail`** (Function) — `budolshap-0.1.0/lib/services/authService.js:186`
- **`resetPassword`** (Function) — `budolshap-0.1.0/lib/services/authService.js:280`
- **`GET`** (Function) — `budolshap-0.1.0/app/api/store/shipping/route.js:19`
- **`PUT`** (Function) — `budolshap-0.1.0/app/api/store/shipping/route.js:33`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `verifyToken` | Function | `budolshap-0.1.0/lib/token.js` | 11 |
| `verifyEmail` | Function | `budolshap-0.1.0/lib/services/authService.js` | 186 |
| `resetPassword` | Function | `budolshap-0.1.0/lib/services/authService.js` | 280 |
| `GET` | Function | `budolshap-0.1.0/app/api/store/shipping/route.js` | 19 |
| `PUT` | Function | `budolshap-0.1.0/app/api/store/shipping/route.js` | 33 |
| `POST` | Function | `budolshap-0.1.0/app/api/auth/logout/route.js` | 6 |
| `POST` | Function | `budolshap-0.1.0/app/api/orders/[orderId]/payment-proof/route.js` | 6 |
| `normalizeStatus` | Function | `budolshap-0.1.0/lib/shipping/statusMapper.js` | 83 |
| `POST` | Function | `budolshap-0.1.0/app/api/webhooks/lalamove/route.js` | 24 |
| `POST` | Function | `budolshap-0.1.0/app/api/orders/[orderId]/sync-lalamove/route.js` | 13 |
| `validateShippingData` | Function | `budolshap-0.1.0/lib/shipping/shippingContract.js` | 166 |
| `updateShippingStatus` | Function | `budolshap-0.1.0/lib/shipping/shippingContract.js` | 244 |
| `arrangeShipment` | Function | `budolshap-0.1.0/lib/services/shippingService.js` | 897 |
| `POST` | Function | `budolshap-0.1.0/app/api/shipping/arrange/route.js` | 12 |
| `isBudolShapShippingEnabledServer` | Function | `budolshap-0.1.0/lib/shipping/featureFlags.js` | 78 |
| `getBudolShapShippingSLADaysServer` | Function | `budolshap-0.1.0/lib/shipping/featureFlags.js` | 96 |
| `POST` | Function | `budolshap-0.1.0/app/api/orders/overdue-shipping/sweep/route.js` | 13 |
| `GET` | Function | `budolshap-0.1.0/app/api/orders/overdue-shipping/sweep/route.js` | 161 |
| `getAuthenticatedStore` | Function | `budolshap-0.1.0/app/api/store/shipping/route.js` | 5 |
| `main` | Function | `scripts/test_scripts/budolShap/v2/test-sync.mjs` | 6 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `PUT → VerifyToken` | cross_community | 5 |
| `POST → VerifyToken` | cross_community | 5 |
| `GET → VerifyToken` | cross_community | 5 |
| `DELETE → VerifyToken` | cross_community | 5 |
| `POST → FindUnique` | cross_community | 5 |
| `GET → VerifyToken` | cross_community | 5 |
| `GET → VerifyToken` | cross_community | 5 |
| `GET → VerifyToken` | cross_community | 5 |
| `POST → VerifyToken` | cross_community | 5 |
| `POST → VerifyToken` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Test_scripts_2 | 12 calls |
| Services | 4 calls |
| Legacy | 1 calls |
| Kyc | 1 calls |
| Test_scripts | 1 calls |

## How to Explore

1. `gitnexus_context({name: "verifyToken"})` — see callers and callees
2. `gitnexus_query({query: "shipping"})` — find related execution flows
3. Read key files listed above for implementation details
