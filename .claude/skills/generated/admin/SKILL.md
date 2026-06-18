---
name: admin
description: "Skill for the Admin area of budolEcosystem. 36 symbols across 16 files."
---

# Admin

36 symbols | 16 files | Cohesion: 79%

## When to Use

- Working with code in `budolshap-0.1.0/`
- Understanding how onSubmit, convertImageToBase64, onSubmitHandler work
- Modifying admin-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `budolshap-0.1.0/components/admin/VariationMatrixManager.jsx` | VariationMatrixManager, handleImageAction, removeTier, addOption, updateOption (+6) |
| `budolshap-0.1.0/components/admin/ComplianceShield.jsx` | ComplianceShield, fetchTelemetry, getStatusColor, getStatusBg |
| `budolshap-0.1.0/components/admin/AdminLayout.jsx` | AdminLayout, fetchIsAdmin, fetchSettings |
| `budolpay-0.1.0/apps/admin/hooks/useIdleTimeout.ts` | useIdleTimeout, resetTimer, handleActivity |
| `budolshap-0.1.0/app/(public)/create-store/page.jsx` | convertImageToBase64, onSubmitHandler |
| `budolpay-0.1.0/apps/admin/components/SessionProvider.tsx` | SessionProvider, performAutoLogout |
| `budolshap-0.1.0/lib/auth-client.js` | clearAuth, logout |
| `budolshap-0.1.0/components/address/AddressFormManager.jsx` | loading |
| `budolshap-0.1.0/components/store/add-product/DragDropImageUpload.jsx` | handleRemoveBackground |
| `budolshap-0.1.0/components/store/add-product/AddProductWizard.jsx` | onSubmit |

## Entry Points

Start here when exploring this area:

- **`onSubmit`** (Function) — `budolshap-0.1.0/components/store/add-product/AddProductWizard.jsx:469`
- **`convertImageToBase64`** (Function) — `budolshap-0.1.0/app/(public)/create-store/page.jsx:56`
- **`onSubmitHandler`** (Function) — `budolshap-0.1.0/app/(public)/create-store/page.jsx:115`
- **`useIdleTimeout`** (Function) — `budolpay-0.1.0/apps/admin/hooks/useIdleTimeout.ts:13`
- **`resetTimer`** (Function) — `budolpay-0.1.0/apps/admin/hooks/useIdleTimeout.ts:24`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `onSubmit` | Function | `budolshap-0.1.0/components/store/add-product/AddProductWizard.jsx` | 469 |
| `convertImageToBase64` | Function | `budolshap-0.1.0/app/(public)/create-store/page.jsx` | 56 |
| `onSubmitHandler` | Function | `budolshap-0.1.0/app/(public)/create-store/page.jsx` | 115 |
| `useIdleTimeout` | Function | `budolpay-0.1.0/apps/admin/hooks/useIdleTimeout.ts` | 13 |
| `resetTimer` | Function | `budolpay-0.1.0/apps/admin/hooks/useIdleTimeout.ts` | 24 |
| `handleActivity` | Function | `budolpay-0.1.0/apps/admin/hooks/useIdleTimeout.ts` | 45 |
| `SessionProvider` | Function | `budolpay-0.1.0/apps/admin/components/SessionProvider.tsx` | 11 |
| `performAutoLogout` | Function | `budolpay-0.1.0/apps/admin/components/SessionProvider.tsx` | 25 |
| `clearAuth` | Function | `budolshap-0.1.0/lib/auth-client.js` | 109 |
| `logout` | Function | `budolshap-0.1.0/lib/auth-client.js` | 134 |
| `logout` | Function | `budolshap-0.1.0/context/AuthContext.jsx` | 134 |
| `getNextAuditDate` | Function | `budolshap-0.1.0/lib/dateUtils.js` | 88 |
| `VariationMatrixManager` | Function | `budolshap-0.1.0/components/admin/VariationMatrixManager.jsx` | 8 |
| `handleImageAction` | Function | `budolshap-0.1.0/components/admin/VariationMatrixManager.jsx` | 32 |
| `removeTier` | Function | `budolshap-0.1.0/components/admin/VariationMatrixManager.jsx` | 139 |
| `addOption` | Function | `budolshap-0.1.0/components/admin/VariationMatrixManager.jsx` | 145 |
| `updateOption` | Function | `budolshap-0.1.0/components/admin/VariationMatrixManager.jsx` | 151 |
| `removeOption` | Function | `budolshap-0.1.0/components/admin/VariationMatrixManager.jsx` | 157 |
| `generateMatrix` | Function | `budolshap-0.1.0/components/admin/VariationMatrixManager.jsx` | 250 |
| `removeMatrixItem` | Function | `budolshap-0.1.0/components/admin/VariationMatrixManager.jsx` | 308 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `AdminLayout → SetLoading` | cross_community | 3 |
| `AdminLayout → GetToken` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Components | 5 calls |
| Auth | 1 calls |
| Context | 1 calls |
| Coupons | 1 calls |

## How to Explore

1. `gitnexus_context({name: "onSubmit"})` — see callers and callees
2. `gitnexus_query({query: "admin"})` — find related execution flows
3. Read key files listed above for implementation details
