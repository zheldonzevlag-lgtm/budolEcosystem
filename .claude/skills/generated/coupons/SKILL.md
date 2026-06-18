---
name: coupons
description: "Skill for the Coupons area of budolEcosystem. 28 symbols across 13 files."
---

# Coupons

28 symbols | 13 files | Cohesion: 72%

## When to Use

- Working with code in `budolshap-0.1.0/`
- Understanding how useStoreWallet, useAuth, WalletPage work
- Modifying coupons-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `budolshap-0.1.0/app/admin/coupons/page.jsx` | AdminCoupons, fetchCoupons, handleAddCoupon, confirmDelete, handleEdit (+2) |
| `budolshap-0.1.0/app/store/coupons/page.jsx` | CouponsPage, fetchCoupons, handleCreate |
| `budolshap-0.1.0/app/admin/memberships/page.jsx` | MembershipApplicationsPage, fetchApplications, handleAction |
| `budolshap-0.1.0/app/admin/kyc/page.jsx` | KYCApprovalPage, fetchApplications, handleAction |
| `budolshap-0.1.0/app/store/shipping/page.jsx` | ShippingPage, fetchShippingProfile |
| `budolshap-0.1.0/app/store/chat/page.jsx` | StoreChatPage, fetchUserAndChats |
| `budolshap-0.1.0/app/(public)/coupons/page.jsx` | handleClaim, CouponCard |
| `budolshap-0.1.0/hooks/useStoreWallet.js` | useStoreWallet |
| `budolshap-0.1.0/context/AuthContext.jsx` | useAuth |
| `budolshap-0.1.0/components/store/StoreNavbar.jsx` | StoreNavbar |

## Entry Points

Start here when exploring this area:

- **`useStoreWallet`** (Function) — `budolshap-0.1.0/hooks/useStoreWallet.js:4`
- **`useAuth`** (Function) — `budolshap-0.1.0/context/AuthContext.jsx:167`
- **`WalletPage`** (Function) — `budolshap-0.1.0/app/store/wallet/page.jsx:9`
- **`ShippingPage`** (Function) — `budolshap-0.1.0/app/store/shipping/page.jsx:7`
- **`fetchShippingProfile`** (Function) — `budolshap-0.1.0/app/store/shipping/page.jsx:21`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `useStoreWallet` | Function | `budolshap-0.1.0/hooks/useStoreWallet.js` | 4 |
| `useAuth` | Function | `budolshap-0.1.0/context/AuthContext.jsx` | 167 |
| `WalletPage` | Function | `budolshap-0.1.0/app/store/wallet/page.jsx` | 9 |
| `ShippingPage` | Function | `budolshap-0.1.0/app/store/shipping/page.jsx` | 7 |
| `fetchShippingProfile` | Function | `budolshap-0.1.0/app/store/shipping/page.jsx` | 21 |
| `CouponsPage` | Function | `budolshap-0.1.0/app/store/coupons/page.jsx` | 7 |
| `fetchCoupons` | Function | `budolshap-0.1.0/app/store/coupons/page.jsx` | 24 |
| `handleCreate` | Function | `budolshap-0.1.0/app/store/coupons/page.jsx` | 46 |
| `StoreChatPage` | Function | `budolshap-0.1.0/app/store/chat/page.jsx` | 9 |
| `fetchUserAndChats` | Function | `budolshap-0.1.0/app/store/chat/page.jsx` | 21 |
| `MembershipApplicationsPage` | Function | `budolshap-0.1.0/app/admin/memberships/page.jsx` | 10 |
| `fetchApplications` | Function | `budolshap-0.1.0/app/admin/memberships/page.jsx` | 26 |
| `handleAction` | Function | `budolshap-0.1.0/app/admin/memberships/page.jsx` | 53 |
| `KYCApprovalPage` | Function | `budolshap-0.1.0/app/admin/kyc/page.jsx` | 11 |
| `fetchApplications` | Function | `budolshap-0.1.0/app/admin/kyc/page.jsx` | 32 |
| `handleAction` | Function | `budolshap-0.1.0/app/admin/kyc/page.jsx` | 60 |
| `AdminCoupons` | Function | `budolshap-0.1.0/app/admin/coupons/page.jsx` | 7 |
| `fetchCoupons` | Function | `budolshap-0.1.0/app/admin/coupons/page.jsx` | 24 |
| `handleAddCoupon` | Function | `budolshap-0.1.0/app/admin/coupons/page.jsx` | 49 |
| `confirmDelete` | Function | `budolshap-0.1.0/app/admin/coupons/page.jsx` | 106 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `MembershipApplicationsPage → SetLoading` | cross_community | 4 |
| `KYCApprovalPage → SetLoading` | cross_community | 4 |
| `StoreChatPage → SetLoading` | cross_community | 3 |
| `AdminCoupons → FetchCoupons` | intra_community | 3 |
| `CouponsPage → SetLoading` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Components | 9 calls |

## How to Explore

1. `gitnexus_context({name: "useStoreWallet"})` — see callers and callees
2. `gitnexus_query({query: "coupons"})` — find related execution flows
3. Read key files listed above for implementation details
