# Phase 5: End-to-End Testing Checklist

**Date**: December 29, 2025  
**Objective**: Comprehensive testing of universal status system across all components

---

## 🧪 Test Scenarios

### **Scenario 1: Regular Order Flow (Seller → Buyer)**

#### Test Steps:
1. **Order Creation**
   - [ ] Create new order
   - [ ] Verify status: `ORDER_PLACED`
   - [ ] Check buyer UI shows "Order Placed"
   - [ ] Check seller UI shows "Order Placed"

2. **Payment**
   - [ ] Mark order as paid
   - [ ] Verify status: `PAID`
   - [ ] Check both UIs show "Paid"

3. **Courier Booking (Lalamove)**
   - [ ] Book Lalamove courier
   - [ ] Verify Lalamove status: `ASSIGNING_DRIVER`
   - [ ] Verify order status: `TO_SHIP`
   - [ ] Check buyer UI shows "📦 To Ship"
   - [ ] Check seller UI shows "To Ship" in "Booked" tab
   - [ ] Check progress tracker shows "To Ship" stage
   - [ ] Check timeline shows "To Ship" event

4. **Driver Assignment**
   - [ ] Simulate Lalamove status: `ON_GOING`
   - [ ] Verify order status remains: `TO_SHIP`
   - [ ] Check both UIs still show "To Ship"
   - [ ] Verify no status regression

5. **Package Pickup**
   - [ ] Simulate Lalamove status: `PICKED_UP`
   - [ ] Verify order status: `SHIPPING`
   - [ ] Check buyer UI shows "🚚 Shipping"
   - [ ] Check seller UI shows "Shipping" in "In Transit" tab
   - [ ] Check progress tracker shows "Shipping" stage (active/pulsating)
   - [ ] Check timeline shows "Shipping" event as current
   - [ ] Check map badge shows "Shipping"

6. **Delivery Completion**
   - [ ] Simulate Lalamove status: `COMPLETED`
   - [ ] Verify order status: `DELIVERED`
   - [ ] Check buyer UI shows "✅ Delivered"
   - [ ] Check seller UI shows "Delivered" in "Delivered" tab
   - [ ] Check progress tracker shows "Delivered" stage (completed)
   - [ ] Check timeline shows "Delivered" event
   - [ ] Check map shows completion screen (not gray iframe)

---

### **Scenario 2: Return Flow (Buyer → Seller)**

#### Test Steps:
1. **Return Request**
   - [ ] Buyer requests return
   - [ ] Verify order status: `RETURN_REQUESTED`
   - [ ] Check both UIs show return status

2. **Return Approval**
   - [ ] Seller approves return
   - [ ] Verify order status: `RETURN_APPROVED`
   - [ ] Check both UIs updated

3. **Return Courier Booking**
   - [ ] Book return courier (Lalamove)
   - [ ] Verify Lalamove status: `ASSIGNING_DRIVER`
   - [ ] Verify return status: `TO_PICKUP`
   - [ ] Check buyer UI shows "To Pick Up"
   - [ ] Check seller UI shows return in progress
   - [ ] Check progress tracker shows "To Pick Up" stage

4. **Return Package Pickup**
   - [ ] Simulate Lalamove status: `PICKED_UP`
   - [ ] Verify return status: `SHIPPING`
   - [ ] Check buyer UI shows "Shipping to Seller"
   - [ ] Check progress tracker shows "Shipping" stage
   - [ ] Check timeline shows return shipping event

5. **Return Delivery to Seller**
   - [ ] Simulate Lalamove status: `COMPLETED`
   - [ ] Verify return status: `DELIVERED`
   - [ ] Verify auto-refund triggered
   - [ ] Verify order status: `REFUNDED`
   - [ ] Check buyer UI shows "💰 REFUNDED"
   - [ ] Check seller UI shows "Refunded"
   - [ ] Check progress tracker shows "Refunded" stage
   - [ ] Check map shows refunded completion screen

---

### **Scenario 3: Edge Cases**

#### Test 3.1: Webhook vs Polling
- [ ] Trigger webhook for status update
- [ ] Verify status updates immediately
- [ ] Trigger polling sync
- [ ] Verify status updates correctly
- [ ] Check no race conditions

#### Test 3.2: Multiple Rapid Status Changes
- [ ] Simulate rapid status changes (ASSIGNING → ON_GOING → PICKED_UP)
- [ ] Verify final status is correct
- [ ] Check no intermediate status stuck
- [ ] Verify UI updates smoothly

#### Test 3.3: Delivery Failure
- [ ] Simulate Lalamove status: `CANCELLED`
- [ ] Verify order status: `PROCESSING` (reset for rebooking)
- [ ] Check booking ID cleared
- [ ] Check failure archived in previousAttempts
- [ ] Verify can rebook courier

#### Test 3.4: Unknown Lalamove Status
- [ ] Simulate unknown status
- [ ] Verify graceful handling (no crash)
- [ ] Check fallback behavior
- [ ] Verify logs show unknown status

#### Test 3.5: Null/Undefined Handling
- [ ] Test with null shipping data
- [ ] Test with undefined status
- [ ] Test with missing bookingId
- [ ] Verify no errors, graceful fallback

---

### **Scenario 4: Database Consistency**

#### Test Steps:
- [ ] Check order record has universal status in `status` field
- [ ] Check shipping record has raw Lalamove status in `shipping.status`
- [ ] Verify return record has universal status
- [ ] Check no data corruption
- [ ] Verify timestamps updated correctly

---

### **Scenario 5: Real-Time Updates**

#### Test Steps:
- [ ] Open buyer UI in one browser
- [ ] Open seller UI in another browser
- [ ] Trigger status change via webhook
- [ ] Verify both UIs update in real-time
- [ ] Check polling updates work
- [ ] Verify no stale data

---

### **Scenario 6: Backward Compatibility**

#### Test Steps:
- [ ] Find order with old status (`IN_TRANSIT`)
- [ ] Verify displays as "Shipping"
- [ ] Check no errors in console
- [ ] Verify can still update status
- [ ] Check legacy status mapping works

---

## 🔍 Component-Specific Tests

### OrderProgressTracker
- [ ] Shows correct stage for each status
- [ ] Active stage highlighted correctly
- [ ] Completed stages marked with checkmark
- [ ] Return flow displays correctly
- [ ] No visual glitches

### LalamoveTracking
- [ ] Map loads correctly
- [ ] Status badge shows correct label
- [ ] Status badge has correct color
- [ ] Driver info displays (if available)
- [ ] Completion screen shows for terminal states
- [ ] No gray iframe for completed orders

### TrackingTimeline
- [ ] Events appear in correct order
- [ ] Current event highlighted (pulsating)
- [ ] Completed events marked correctly
- [ ] Timestamps accurate
- [ ] Return events display correctly

### Seller Orders Page
- [ ] Orders appear in correct tabs
- [ ] Status badges correct
- [ ] Auto-sync works
- [ ] Filters work correctly
- [ ] Bulk actions work

---

## 📊 Performance Tests

- [ ] Page load time acceptable
- [ ] No memory leaks
- [ ] Polling doesn't cause lag
- [ ] Real-time updates smooth
- [ ] No excessive API calls

---

## 🐛 Error Handling Tests

- [ ] Network failure during sync
- [ ] Invalid API response
- [ ] Webhook with bad data
- [ ] Concurrent status updates
- [ ] Database connection issues

---

## ✅ Success Criteria

All tests must pass with:
- ✅ No console errors
- ✅ No visual glitches
- ✅ Consistent status across all UIs
- ✅ Correct database updates
- ✅ Smooth user experience

---

## 📝 Test Results

**Test Execution Date**: _____________  
**Tester**: _____________  
**Environment**: Development / Staging / Production  

**Overall Result**: ⬜ PASS / ⬜ FAIL  

**Issues Found**: _____________  
**Notes**: _____________

---

## 🚀 Ready to Test

**Instructions:**
1. Start development server: `npm run dev`
2. Open buyer UI: `http://localhost:3000/orders/[orderId]`
3. Open seller UI: `http://localhost:3000/store/orders`
4. Follow test scenarios above
5. Check off each item as you test
6. Document any issues found

**Let's begin testing!**
