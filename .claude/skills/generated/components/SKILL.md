---
name: components
description: "Skill for the Components area of budolEcosystem. 214 symbols across 87 files."
---

# Components

214 symbols | 87 files | Cohesion: 81%

## When to Use

- Working with code in `budolshap-0.1.0/`
- Understanding how handleRequestPassword, handleValidatePassword, handleClose work
- Modifying components-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `budolshap-0.1.0/components/KYCWizard.jsx` | KYCWizard, stopCamera, captureScan, nextStep, renderStep1 (+6) |
| `budolshap-0.1.0/components/StoreAddressesManager.jsx` | handleAddAddress, StoreAddressesManager, handleEditAddress, handleDeleteAddress, formatAddress (+3) |
| `budolshap-0.1.0/components/StoreAddressModal.jsx` | StoreAddressModal, getCitiesForDistrict, getDefaultDistrict, getDefaultCityForDistrict, getZipForCity (+2) |
| `budolshap-0.1.0/components/ProductDetails.jsx` | ProductDetails, syncActiveIndexWithImage, handleVariationSelect, applyThumbnailItem, handleScrollUp (+2) |
| `budolpay-0.1.0/apps/admin/components/EditUserModal.tsx` | normalizePhone, normalizePhoneStrict, isValidPhone, EditUserModal, fetchMe (+1) |
| `budolshap-0.1.0/components/RealtimeProvider.jsx` | RealtimeProvider, handleGlobalEvent, patchOrderCache, setupPusherListeners, setupSocketListeners |
| `budolshap-0.1.0/components/Navbar.jsx` | Navbar, fetchStore, handleUpdates, handleSearch, handleMobileSearchSubmit |
| `budolshap-0.1.0/components/OrderSummary.jsx` | OrderSummary, fetchAddresses, formatAddress, handleCouponCode, handleQRCancel |
| `budolshap-0.1.0/components/OrderHeader.jsx` | OrderHeader, getEstimatedDelivery, getShippingStatusDisplay, getHeaderColor, getTextColor |
| `budolshap-0.1.0/components/MarketingAdPopup.jsx` | MarketingAdPopup, positionClass, fetchSettings, handleDismiss, renderTitle |

## Entry Points

Start here when exploring this area:

- **`handleRequestPassword`** (Function) — `budolshap-0.1.0/components/KnowledgeBaseShortcut.jsx:50`
- **`handleValidatePassword`** (Function) — `budolshap-0.1.0/components/KnowledgeBaseShortcut.jsx:79`
- **`handleClose`** (Function) — `budolshap-0.1.0/components/KnowledgeBaseShortcut.jsx:150`
- **`handleKeyPress`** (Function) — `budolshap-0.1.0/components/KnowledgeBaseShortcut.jsx:160`
- **`handlePay`** (Function) — `budolshap-0.1.0/components/GcashPayButton.jsx:7`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `handleRequestPassword` | Function | `budolshap-0.1.0/components/KnowledgeBaseShortcut.jsx` | 50 |
| `handleValidatePassword` | Function | `budolshap-0.1.0/components/KnowledgeBaseShortcut.jsx` | 79 |
| `handleClose` | Function | `budolshap-0.1.0/components/KnowledgeBaseShortcut.jsx` | 150 |
| `handleKeyPress` | Function | `budolshap-0.1.0/components/KnowledgeBaseShortcut.jsx` | 160 |
| `handlePay` | Function | `budolshap-0.1.0/components/GcashPayButton.jsx` | 7 |
| `CategoriesSection` | Function | `budolshap-0.1.0/components/CategoriesSection.jsx` | 45 |
| `handlePay` | Function | `budolshap-0.1.0/components/payment/PaymentMethodSelector.jsx` | 39 |
| `AdminDashboard` | Function | `budolshap-0.1.0/app/admin/page.jsx` | 8 |
| `fetchDashboardData` | Function | `budolshap-0.1.0/app/admin/page.jsx` | 27 |
| `AdminCancellationSettings` | Function | `budolshap-0.1.0/components/admin/settings/AdminCancellationSettings.jsx` | 6 |
| `fetchSettings` | Function | `budolshap-0.1.0/components/admin/settings/AdminCancellationSettings.jsx` | 18 |
| `StoreAddProductPage` | Function | `budolshap-0.1.0/app/store/add-product/page.jsx` | 9 |
| `fetchData` | Function | `budolshap-0.1.0/app/store/add-product/page.jsx` | 26 |
| `fetchReturns` | Function | `budolshap-0.1.0/app/admin/returns/page.jsx` | 18 |
| `delayDebounceFn` | Function | `budolshap-0.1.0/app/admin/returns/page.jsx` | 48 |
| `handleManualTrigger` | Function | `budolshap-0.1.0/app/admin/escrow/page.jsx` | 63 |
| `AdminAnalyticsPage` | Function | `budolshap-0.1.0/app/admin/analytics/page.jsx` | 6 |
| `fetchAnalytics` | Function | `budolshap-0.1.0/app/admin/analytics/page.jsx` | 14 |
| `handleSubmit` | Function | `budolshap-0.1.0/app/(public)/resend-verification/page.jsx` | 14 |
| `handleSubmit` | Function | `budolshap-0.1.0/app/(public)/forgot-password/page.jsx` | 13 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Build → SetLoading` | cross_community | 8 |
| `Bootstrap → _onWsStatusChange` | cross_community | 6 |
| `Bootstrap → Reinit` | cross_community | 6 |
| `Bootstrap → Emit` | cross_community | 6 |
| `StoreOrders → SetLoading` | cross_community | 4 |
| `MembershipApplicationsPage → SetLoading` | cross_community | 4 |
| `KYCApprovalPage → SetLoading` | cross_community | 4 |
| `AuditLogsPage → SetLoading` | cross_community | 4 |
| `RealtimeProvider → PatchOrderCache` | intra_community | 4 |
| `RealtimeProvider → DispatchEvent` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Coupons | 7 calls |
| Test_scripts_2 | 5 calls |
| BudolPay | 5 calls |
| Admin | 4 calls |
| Hooks | 2 calls |
| Context | 1 calls |
| Returns | 1 calls |
| Pricing | 1 calls |

## How to Explore

1. `gitnexus_context({name: "handleRequestPassword"})` — see callers and callees
2. `gitnexus_query({query: "components"})` — find related execution flows
3. Read key files listed above for implementation details
