---
name: auth
description: "Skill for the Auth area of budolEcosystem. 26 symbols across 13 files."
---

# Auth

26 symbols | 13 files | Cohesion: 79%

## When to Use

- Working with code in `budolshap-0.1.0/`
- Understanding how ReturnRequestModal, removeImage, PaymentProofUpload work
- Modifying auth-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `budolshap-0.1.0/components/auth/AuthForm.jsx` | isValidEmail, AuthForm, startCamera, retakeSelfie, stopCamera (+1) |
| `budolshap-0.1.0/components/admin/AdminSidebar.jsx` | AdminSidebar, handleMouseEnter, getInitials |
| `budolshap-0.1.0/app/api/knowledge-base/auth/route.js` | generatePassword, cleanExpiredPasswords, POST |
| `budolshap-0.1.0/components/auth/MathCaptcha.jsx` | MathCaptcha, generateChallenge, verifyAnswer |
| `budolshap-0.1.0/components/store/StoreSidebar.jsx` | StoreSidebar, handleMouseEnter |
| `budolshap-0.1.0/components/orders/ReturnRequestModal.jsx` | ReturnRequestModal, removeImage |
| `budolshap-0.1.0/components/payment/PaymentProofUpload.jsx` | PaymentProofUpload |
| `budolshap-0.1.0/components/address/MapPicker.jsx` | click |
| `budolshap-0.1.0/app/(public)/profile/page.jsx` | ProfilePageContent |
| `budolshap-0.1.0/lib/orderAutoComplete.js` | processAutoCompletions |

## Entry Points

Start here when exploring this area:

- **`ReturnRequestModal`** (Function) — `budolshap-0.1.0/components/orders/ReturnRequestModal.jsx:8`
- **`removeImage`** (Function) — `budolshap-0.1.0/components/orders/ReturnRequestModal.jsx:80`
- **`PaymentProofUpload`** (Function) — `budolshap-0.1.0/components/payment/PaymentProofUpload.jsx:6`
- **`processAutoCompletions`** (Function) — `budolshap-0.1.0/lib/orderAutoComplete.js:51`
- **`releaseFunds`** (Function) — `budolshap-0.1.0/lib/escrow.js:158`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `ReturnRequestModal` | Function | `budolshap-0.1.0/components/orders/ReturnRequestModal.jsx` | 8 |
| `removeImage` | Function | `budolshap-0.1.0/components/orders/ReturnRequestModal.jsx` | 80 |
| `PaymentProofUpload` | Function | `budolshap-0.1.0/components/payment/PaymentProofUpload.jsx` | 6 |
| `processAutoCompletions` | Function | `budolshap-0.1.0/lib/orderAutoComplete.js` | 51 |
| `releaseFunds` | Function | `budolshap-0.1.0/lib/escrow.js` | 158 |
| `sendEmail` | Function | `budolshap-0.1.0/lib/email.js` | 580 |
| `POST` | Function | `budolshap-0.1.0/app/api/knowledge-base/auth/route.js` | 73 |
| `POST` | Function | `budolshap-0.1.0/app/api/cron/auto-complete-orders/route.js` | 67 |
| `MathCaptcha` | Function | `budolshap-0.1.0/components/auth/MathCaptcha.jsx` | 9 |
| `generateChallenge` | Function | `budolshap-0.1.0/components/auth/MathCaptcha.jsx` | 16 |
| `verifyAnswer` | Function | `budolshap-0.1.0/components/auth/MathCaptcha.jsx` | 38 |
| `StoreSidebar` | Function | `budolshap-0.1.0/components/store/StoreSidebar.jsx` | 11 |
| `handleMouseEnter` | Function | `budolshap-0.1.0/components/store/StoreSidebar.jsx` | 19 |
| `isValidEmail` | Function | `budolshap-0.1.0/components/auth/AuthForm.jsx` | 10 |
| `AuthForm` | Function | `budolshap-0.1.0/components/auth/AuthForm.jsx` | 15 |
| `startCamera` | Function | `budolshap-0.1.0/components/auth/AuthForm.jsx` | 267 |
| `retakeSelfie` | Function | `budolshap-0.1.0/components/auth/AuthForm.jsx` | 403 |
| `AdminSidebar` | Function | `budolshap-0.1.0/components/admin/AdminSidebar.jsx` | 13 |
| `handleMouseEnter` | Function | `budolshap-0.1.0/components/admin/AdminSidebar.jsx` | 27 |
| `getInitials` | Function | `budolshap-0.1.0/components/admin/AdminSidebar.jsx` | 205 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `POST → FindUnique` | cross_community | 6 |
| `POST → FindUnique` | cross_community | 5 |
| `POST → $transaction` | cross_community | 4 |
| `POST → CreateLedgerEntry` | cross_community | 4 |
| `POST → BuildOrderPaymentEntries` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Test_scripts_2 | 3 calls |
| Coupons | 3 calls |
| Services | 2 calls |
| Paymongo | 1 calls |
| Shipping | 1 calls |

## How to Explore

1. `gitnexus_context({name: "ReturnRequestModal"})` — see callers and callees
2. `gitnexus_query({query: "auth"})` — find related execution flows
3. Read key files listed above for implementation details
