# Shopee-Style Lalamove Status Sync Implementation Plan

**Project**: Unified Status Synchronization for Orders & Returns
**Date**: December 29, 2025
**Objective**: Ensure Lalamove status, Seller UI, and Buyer UI are perfectly synchronized using a Shopee-inspired universal status model

---

## 📋 Overview

### Current Problem
- Lalamove "ON_GOING" → Shows "IN_TRANSIT" (incorrect - driver hasn't picked up yet)
- Lalamove "PICKED_UP" → Shows "IN_TRANSIT" (correct but confusing)
- Inconsistent status display between Seller UI and Buyer UI
- Courier-specific logic scattered across codebase

### Proposed Solution
- Universal status model: `TO_SHIP` → `SHIPPING` → `DELIVERED`
- Single source of truth for status mapping
- Consistent display across all UIs
- Courier-agnostic architecture

---

## 🎯 Implementation Phases

### **PHASE 1: Core Status Mapping Layer** (Est: 30 mins)
**Goal**: Create universal status normalization system

#### Tasks:
1. ✅ Backup all files to `backup/shopee-lalamove-seller-ui-buyer-ui-sync/`
2. Create status mapping utility (`lib/shipping/statusMapper.js`)
3. Update shipping config with universal status definitions
4. Add status normalization functions

#### Files Modified:
- `lib/shipping/config.js` (NEW: universal status definitions)
- `lib/shipping/statusMapper.js` (NEW: mapping logic)

#### Testing Checklist:
- [ ] Status mapper correctly converts Lalamove statuses
- [ ] Returns correct universal status for each courier status
- [ ] Handles edge cases (null, undefined, unknown statuses)

**Estimated Time**: 30 minutes

---

### **PHASE 2: Backend Sync Services** (Est: 45 mins)
**Goal**: Update sync logic to use universal statuses

#### Tasks:
1. Refactor `shippingOrderUpdater.js` to use status mapper
2. Update `sync-lalamove/route.js` to normalize statuses
3. Ensure order status updates use universal statuses
4. Update return status mapping logic

#### Files Modified:
- `services/shippingOrderUpdater.js`
- `app/api/orders/[orderId]/sync-lalamove/route.js`

#### Testing Checklist:
- [ ] Regular order: ASSIGNING_DRIVER → TO_SHIP
- [ ] Regular order: ON_GOING → TO_SHIP
- [ ] Regular order: PICKED_UP → SHIPPING
- [ ] Regular order: COMPLETED → DELIVERED
- [ ] Return order: Same mapping works correctly
- [ ] Database updates reflect universal statuses
- [ ] Webhook processing uses universal statuses

**Estimated Time**: 45 minutes

---

### **PHASE 3: Buyer UI Components** (Est: 30 mins)
**Goal**: Update buyer-facing components to display universal statuses

#### Tasks:
1. Update `OrderProgressTracker.jsx` to use universal statuses
2. Update `TrackingTimeline.jsx` event labels
3. Update `LalamoveTracking.jsx` status badge
4. Ensure consistent terminology across all components

#### Files Modified:
- `components/OrderProgressTracker.jsx`
- `components/TrackingTimeline.jsx`
- `components/LalamoveTracking.jsx`

#### Testing Checklist:
- [ ] Progress tracker shows correct stage for each status
- [ ] Timeline events use clear, universal labels
- [ ] Map badge displays correct status
- [ ] No courier-specific terminology visible to buyer
- [ ] Return flow displays correctly

**Estimated Time**: 30 minutes

---

### **PHASE 4: Seller UI Components** (Est: 30 mins)
**Goal**: Update seller-facing components to display universal statuses

#### Tasks:
1. Update `app/store/orders/page.jsx` tab logic
2. Update order status badges
3. Update filter logic to use universal statuses
4. Ensure seller sees same statuses as buyer

#### Files Modified:
- `app/store/orders/page.jsx`
- `app/store/returns/page.jsx` (if needed)

#### Testing Checklist:
- [ ] Orders appear in correct tabs (To Ship, Shipping, etc.)
- [ ] Status badges match buyer UI
- [ ] Filters work with universal statuses
- [ ] Return orders display correctly
- [ ] No discrepancies between seller and buyer views

**Estimated Time**: 30 minutes

---

### **PHASE 5: End-to-End Testing** (Est: 45 mins)
**Goal**: Comprehensive testing of entire flow

#### Test Scenarios:

**Scenario 1: Regular Order Flow**
1. Create order → Verify: ORDER_PLACED
2. Pay order → Verify: PAID
3. Seller books Lalamove → Verify: TO_SHIP (both UIs)
4. Lalamove status: ASSIGNING_DRIVER → Verify: TO_SHIP (both UIs)
5. Lalamove status: ON_GOING → Verify: TO_SHIP (both UIs)
6. Lalamove status: PICKED_UP → Verify: SHIPPING (both UIs)
7. Lalamove status: COMPLETED → Verify: DELIVERED (both UIs)

**Scenario 2: Return Flow**
1. Buyer requests return → Verify: RETURN_REQUESTED
2. Seller approves → Verify: RETURN_APPROVED
3. Seller books return courier → Verify: TO_PICKUP (both UIs)
4. Lalamove status: ASSIGNING_DRIVER → Verify: TO_PICKUP (both UIs)
5. Lalamove status: ON_GOING → Verify: TO_PICKUP (both UIs)
6. Lalamove status: PICKED_UP → Verify: SHIPPING (both UIs)
7. Lalamove status: COMPLETED → Verify: DELIVERED → Auto-refund → REFUNDED

**Scenario 3: Edge Cases**
1. Webhook arrives before polling → Verify: Status syncs correctly
2. Multiple rapid status changes → Verify: No race conditions
3. Unknown Lalamove status → Verify: Graceful fallback
4. Network failure during sync → Verify: Retry logic works

#### Testing Checklist:
- [ ] All Scenario 1 steps pass
- [ ] All Scenario 2 steps pass
- [ ] All Scenario 3 edge cases handled
- [ ] No console errors
- [ ] Database consistency maintained
- [ ] Real-time updates work correctly

**Estimated Time**: 45 minutes

---

### **PHASE 6: Documentation & Cleanup** (Est: 15 mins)
**Goal**: Document changes and clean up code

#### Tasks:
1. Add inline comments explaining status mapping
2. Update API documentation
3. Create status mapping reference guide
4. Remove old courier-specific logic
5. Verify all backups are in place

#### Deliverables:
- Updated code comments
- Status mapping reference document
- Backup verification report

**Estimated Time**: 15 minutes

---

## 📊 Total Estimated Time

| Phase | Duration |
|-------|----------|
| Phase 1: Core Mapping | 30 mins |
| Phase 2: Backend Sync | 45 mins |
| Phase 3: Buyer UI | 30 mins |
| Phase 4: Seller UI | 30 mins |
| Phase 5: E2E Testing | 45 mins |
| Phase 6: Documentation | 15 mins |
| **TOTAL** | **3 hours** |

---

## 🔄 Status Mapping Reference

### Universal Status Flow
```
ORDER_PLACED → PAID → PROCESSING → TO_SHIP → SHIPPING → DELIVERED
```

### Lalamove → Universal Mapping
```
ASSIGNING_DRIVER → TO_SHIP
ON_GOING         → TO_SHIP
PICKED_UP        → SHIPPING
IN_TRANSIT       → SHIPPING (legacy)
COMPLETED        → DELIVERED
CANCELLED        → CANCELLED
EXPIRED          → CANCELLED
REJECTED         → CANCELLED
```

### Return Flow Mapping
```
RETURN_REQUESTED → RETURN_APPROVED → TO_PICKUP → SHIPPING → DELIVERED → REFUNDED
```

---

## ✅ Success Criteria

1. **Consistency**: Seller UI and Buyer UI always show identical statuses
2. **Accuracy**: Lalamove status correctly maps to universal status
3. **Clarity**: User-friendly labels (no technical jargon)
4. **Reliability**: No race conditions or sync issues
5. **Maintainability**: Easy to add new couriers in future

---

## 🚨 Rollback Plan

If issues arise:
1. Stop implementation at current phase
2. Restore files from `backup/shopee-lalamove-seller-ui-buyer-ui-sync/`
3. Run `npm run dev` to verify restoration
4. Document issue for future resolution

---

## 📝 Notes

- All backups stored in: `backup/shopee-lalamove-seller-ui-buyer-ui-sync/`
- Test on development environment first
- Monitor production logs after deployment
- Keep Lalamove raw status in `shipping.status` for debugging
- Universal status stored in `order.status` and `return.status`

---


