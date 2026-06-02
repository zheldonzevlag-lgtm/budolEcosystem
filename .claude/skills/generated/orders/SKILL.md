---
name: orders
description: "Skill for the Orders area of budolEcosystem. 32 symbols across 9 files."
---

# Orders

32 symbols | 9 files | Cohesion: 77%

## When to Use

- Working with code in `budolshap-0.1.0/`
- Understanding how useRealtimeOrders, useBudolShapShipping, fetchSettings work
- Modifying orders-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `budolshap-0.1.0/app/store/orders/page.jsx` | StoreOrders, toggleSection, initStore, updateOrderStatus, handleBookLalamove (+14) |
| `budolshap-0.1.0/app/admin/orders/page.jsx` | AdminOrders, fetchOrders, updateOrderStatus, handleVerifyPayment, getStatusColor |
| `budolshap-0.1.0/hooks/useBudolShapShipping.js` | useBudolShapShipping, fetchSettings |
| `budolshap-0.1.0/hooks/useRealtimeOrders.js` | useRealtimeOrders |
| `budolshap-0.1.0/lib/services/ordersService.js` | getOrders |
| `scripts/test_scripts/budolShap/v2/test-orders-api.mjs` | test |
| `scripts/test_scripts/budolShap/legacy/test-get-orders.mjs` | test |
| `budolshap-0.1.0/app/api/orders/route.js` | GET |
| `budolshap-0.1.0/app/api/internal/orders/route.js` | GET |

## Entry Points

Start here when exploring this area:

- **`useRealtimeOrders`** (Function) — `budolshap-0.1.0/hooks/useRealtimeOrders.js:10`
- **`useBudolShapShipping`** (Function) — `budolshap-0.1.0/hooks/useBudolShapShipping.js:2`
- **`fetchSettings`** (Function) — `budolshap-0.1.0/hooks/useBudolShapShipping.js:7`
- **`StoreOrders`** (Function) — `budolshap-0.1.0/app/store/orders/page.jsx:15`
- **`toggleSection`** (Function) — `budolshap-0.1.0/app/store/orders/page.jsx:41`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `useRealtimeOrders` | Function | `budolshap-0.1.0/hooks/useRealtimeOrders.js` | 10 |
| `useBudolShapShipping` | Function | `budolshap-0.1.0/hooks/useBudolShapShipping.js` | 2 |
| `fetchSettings` | Function | `budolshap-0.1.0/hooks/useBudolShapShipping.js` | 7 |
| `StoreOrders` | Function | `budolshap-0.1.0/app/store/orders/page.jsx` | 15 |
| `toggleSection` | Function | `budolshap-0.1.0/app/store/orders/page.jsx` | 41 |
| `initStore` | Function | `budolshap-0.1.0/app/store/orders/page.jsx` | 61 |
| `updateOrderStatus` | Function | `budolshap-0.1.0/app/store/orders/page.jsx` | 273 |
| `handleBookLalamove` | Function | `budolshap-0.1.0/app/store/orders/page.jsx` | 300 |
| `handleManualBook` | Function | `budolshap-0.1.0/app/store/orders/page.jsx` | 455 |
| `handleSyncStatus` | Function | `budolshap-0.1.0/app/store/orders/page.jsx` | 504 |
| `openModal` | Function | `budolshap-0.1.0/app/store/orders/page.jsx` | 537 |
| `openBudolShapModal` | Function | `budolshap-0.1.0/app/store/orders/page.jsx` | 557 |
| `handleSelectOrder` | Function | `budolshap-0.1.0/app/store/orders/page.jsx` | 622 |
| `executeBulkAction` | Function | `budolshap-0.1.0/app/store/orders/page.jsx` | 638 |
| `toggleProductSelection` | Function | `budolshap-0.1.0/app/store/orders/page.jsx` | 765 |
| `getOrders` | Function | `budolshap-0.1.0/lib/services/ordersService.js` | 22 |
| `GET` | Function | `budolshap-0.1.0/app/api/orders/route.js` | 13 |
| `GET` | Function | `budolshap-0.1.0/app/api/internal/orders/route.js` | 8 |
| `getStatusDisplay` | Function | `budolshap-0.1.0/app/store/orders/page.jsx` | 145 |
| `getReturnStatusDescription` | Function | `budolshap-0.1.0/app/store/orders/page.jsx` | 199 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `StoreOrders → SetLoading` | cross_community | 4 |
| `GET → NormalizeAccountType` | cross_community | 4 |
| `GET → GetConfiguredAdminEmailSet` | cross_community | 4 |
| `AdminOrders → SetLoading` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Components | 5 calls |
| Test_scripts | 2 calls |
| Test_scripts_2 | 1 calls |
| Coupons | 1 calls |
| Auth | 1 calls |
| Returns | 1 calls |
| Upload | 1 calls |
| Check | 1 calls |

## How to Explore

1. `gitnexus_context({name: "useRealtimeOrders"})` — see callers and callees
2. `gitnexus_query({query: "orders"})` — find related execution flows
3. Read key files listed above for implementation details
