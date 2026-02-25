# Industry Standard Practices: Shopee & Lazada Order Status Flow

## 🏢 How Major E-commerce Platforms Handle Order Status

Based on research of **Shopee** and **Lazada** - two of Southeast Asia's largest e-commerce platforms.

---

## 📊 Shopee's Order Status Flow

### **Complete Order Lifecycle:**

```
1. UNPAID
   ↓ (Customer pays)
   
2. READY_TO_SHIP (RTS)
   ↓ (Seller arranges shipment)
   
3. PROCESSED
   ↓ (3PL picks up package)
   
4. SHIPPED
   ↓ (Package in transit)
   
5. LOGISTICS_DELIVERY_DONE
   ↓ (Package delivered)
   
6. TO_CONFIRM_RECEIVE
   ↓ (Awaiting buyer confirmation)
   
7. COMPLETED
```

### **Key Features:**

#### ✅ **Automatic Status Updates**
- **When seller arranges shipment** via integrated logistics:
  - Status automatically changes from `READY_TO_SHIP` → `PROCESSED`
  - Tracking number automatically generated
  
- **When 3PL picks up package:**
  - Status automatically changes to `SHIPPED`
  - 3PL sends "pick up done" notification to Shopee
  
- **When package is delivered:**
  - Status automatically updates to `LOGISTICS_DELIVERY_DONE`
  - Then changes to `TO_CONFIRM_RECEIVE` (awaiting buyer confirmation)
  
- **After buyer confirms or timeout:**
  - Status automatically changes to `COMPLETED`

#### 📡 **Real-Time Tracking**
- Live tracking for both buyers and sellers
- Detailed logistics statuses:
  - `LOGISTICS_NOT_STARTED`
  - `LOGISTICS_REQUEST_CREATED`
  - `LOGISTICS_PICKUP_DONE`
  - `LOGISTICS_DELIVERY_DONE`
  - `LOGISTICS_PICKUP_FAILED`
  - `LOGISTICS_DELIVERY_FAILED`

#### 🔔 **Automated Notifications**
- Sellers receive notifications at every stage
- Buyers get real-time updates via app and email
- Proactive updates for delays or issues

---

## 📊 Lazada's Order Status Flow

### **Complete Order Lifecycle:**

```
1. Order Created
   ↓ (Seller confirms)
   
2. Packed
   ↓ (Seller prints AWB)
   
3. Ready to Ship (RTS)
   ↓ (Courier picks up)
   
4. In Transit
   ↓ (Package being delivered)
   
5. Delivered
   ↓ (Buyer confirmation)
   
6. Completed
```

### **Key Features:**

#### ✅ **Automatic Status Updates**
- **When seller marks as packed:**
  - Status changes to `Packed`
  - AWB (Air Waybill) generated
  
- **When seller marks as Ready to Ship:**
  - Status changes to `Ready to Ship`
  - Courier automatically notified for pickup
  
- **For integrated logistics:**
  - Tracking updates automatically flow from courier to Lazada
  - Status changes happen in real-time
  
- **For third-party logistics (DBS/SOF):**
  - Seller must manually update status to "delivered" or "failed delivery" via API
  - More manual control for non-integrated couriers

#### 📡 **API-Driven Updates**
- `GetOrderTrace` API for logistics tracking
- `ConfirmDeliveryForDBS` API for delivery confirmation
- `FailedDeliveryForDBS` API for failed deliveries
- External systems can update package statuses via API

---

## 🎯 Industry Standard Practices

### **1. Automatic Status Updates (STANDARD)**

Both Shopee and Lazada **automatically update order status** based on delivery events:

| Event | Shopee | Lazada | Standard Practice |
|-------|--------|--------|-------------------|
| **Payment Confirmed** | Auto → READY_TO_SHIP | Auto → Confirmed | ✅ Automatic |
| **Shipment Arranged** | Auto → PROCESSED | Auto → Packed | ✅ Automatic |
| **Package Picked Up** | Auto → SHIPPED | Auto → RTS | ✅ Automatic |
| **In Transit** | Auto → Real-time updates | Auto → In Transit | ✅ Automatic |
| **Delivered** | Auto → LOGISTICS_DELIVERY_DONE | Auto/Manual* | ✅ Automatic (for integrated logistics) |
| **Completed** | Auto → COMPLETED (after confirmation) | Auto → Completed | ✅ Automatic |

**Note:** Lazada requires manual API calls for non-integrated third-party logistics.

---

### **2. Separation of Concerns**

#### **Order Status vs. Delivery Status**

**Shopee Approach:**
- **Single unified status** that progresses through the entire lifecycle
- Delivery status is part of the main order status
- No separate "payment status" and "delivery status"
- Example: `READY_TO_SHIP` → `SHIPPED` → `DELIVERED` → `COMPLETED`

**Lazada Approach:**
- **Unified status** with clear progression
- Logistics tracking available via separate API
- Status reflects both payment and delivery state
- Example: `Packed` → `Ready to Ship` → `Delivered` → `Completed`

**Industry Standard:**
✅ **Unified order status that reflects the current state of the entire order**
- Payment confirmation triggers status change
- Delivery events trigger status changes
- Customer sees one clear status, not multiple conflicting statuses

---

### **3. Webhook Integration**

#### **How Shopee & Lazada Handle Third-Party Logistics:**

**Shopee:**
```javascript
// 3PL sends webhook to Shopee
{
  "event": "PICKUP_DONE",
  "orderId": "...",
  "trackingNumber": "..."
}

// Shopee automatically updates:
order.status = "SHIPPED"  // ✅ Main order status updated
order.logistics.status = "PICKUP_DONE"
```

**Lazada:**
```javascript
// Courier sends status update
{
  "externalOrderId": "...",
  "status": "DELIVERED"
}

// Lazada automatically updates:
order.status = "DELIVERED"  // ✅ Main order status updated
order.trackingInfo.status = "DELIVERED"
```

**Key Insight:**
✅ **Both platforms update the MAIN ORDER STATUS when delivery events occur**
- Not just the shipping/logistics status
- The customer-facing status reflects delivery progress
- No disconnect between "paid" and "delivered"

---

### **4. Real-Time Tracking**

**Standard Practice:**
- ✅ Live tracking for customers
- ✅ Branded tracking pages
- ✅ Automated notifications at each stage
- ✅ Estimated delivery dates
- ✅ Proactive delay notifications

**Shopee Example:**
- Real-time location tracking
- Driver details (name, phone, photo)
- Estimated delivery time
- Timeline of all events

**Lazada Example:**
- Package tracking via `GetOrderTrace` API
- Real-time status updates
- Delivery timeline
- Courier contact information

---

### **5. Buyer Confirmation**

**Shopee:**
- After delivery, status changes to `TO_CONFIRM_RECEIVE`
- Buyer has time to confirm receipt
- Auto-completes after timeout (e.g., 7 days)
- Status then changes to `COMPLETED`

**Lazada:**
- Similar confirmation period
- Auto-completes if no issues reported
- Funds released to seller after confirmation

**Standard Practice:**
✅ **Delivery confirmation period before final completion**
- Protects both buyer and seller
- Allows time for disputes
- Auto-completes to prevent indefinite pending

---

## 🔍 Comparison with Budolshap

### **Current Budolshap Implementation:**

```javascript
// Payment confirmed (PayMongo webhook)
order.status = "PAID"
order.isPaid = true
order.paymentStatus = "paid"

// Delivery completed (Lalamove webhook)
order.shipping.status = "COMPLETED"  // ✅ Updated
order.status = "PAID"                // ❌ NOT updated
```

### **Shopee/Lazada Implementation:**

```javascript
// Payment confirmed
order.status = "READY_TO_SHIP"  // ✅ Status progresses

// Delivery completed
order.status = "DELIVERED"      // ✅ Status progresses
order.logistics.status = "DELIVERY_DONE"
```

---

## 📋 What Shopee/Lazada Do Differently

### **1. Unified Status Progression**

**Shopee/Lazada:**
```
UNPAID → READY_TO_SHIP → SHIPPED → DELIVERED → COMPLETED
```
- One clear status that progresses
- Customer always knows current state
- No confusion between payment and delivery

**Budolshap (Current):**
```
ORDER_PLACED → PAID → (stays PAID even after delivery)
```
- Status stops at PAID
- Delivery completion doesn't update main status
- Customer sees "PAID" even though delivered

---

### **2. Automatic Webhook Processing**

**Shopee/Lazada:**
```javascript
// When 3PL webhook received
case 'DELIVERED':
    order.status = 'DELIVERED'  // ✅ Auto-update main status
    order.deliveredAt = timestamp
    sendNotification(buyer, 'Your order has been delivered')
    break
```

**Budolshap (Current):**
```javascript
// When Lalamove webhook received
case 'COMPLETED':
    order.shipping.status = 'COMPLETED'  // ✅ Updates shipping
    // order.status NOT updated           // ❌ Main status unchanged
    // TODO: Update order status to 'delivered'
    break
```

---

### **3. Customer Experience**

**Shopee/Lazada Customer View:**
```
✅ Order Status: DELIVERED
📦 Tracking: Package delivered at 2:00 PM
👤 Driver: John Doe
📍 Location: Your doorstep
⏰ Delivered: Dec 3, 2025, 2:00 PM
```

**Budolshap Customer View (Current):**
```
⚠️ Order Status: PAID
📦 Delivery: COMPLETED (in shipping details)
💰 Payment: Confirmed
❓ Confusing: Why "PAID" if already delivered?
```

---

## ✅ Industry Standard Recommendations

Based on Shopee and Lazada practices, here's what's considered **standard**:

### **1. Automatic Status Updates (CRITICAL)**

✅ **DO:** Automatically update main order status when delivery events occur

```javascript
// RECOMMENDED IMPLEMENTATION
case 'COMPLETED':
    await prisma.order.update({
        where: { id: order.id },
        data: {
            status: 'DELIVERED',           // ✅ Update main status
            deliveredAt: actualDeliveryTime,
            shipping: {
                ...updatedShipping,
                status: 'COMPLETED'
            }
        }
    })
    
    // Send notification to customer
    await sendDeliveryConfirmationEmail(order)
    break
```

❌ **DON'T:** Keep order status as "PAID" after delivery is complete

---

### **2. Progressive Status Flow**

✅ **DO:** Use a status flow that reflects the entire order lifecycle

**Recommended Status Flow:**
```
ORDER_PLACED → PAID → PROCESSING → SHIPPED → DELIVERED → COMPLETED
```

**When to update:**
- `ORDER_PLACED`: Order created
- `PAID`: Payment confirmed (PayMongo webhook)
- `PROCESSING`: Seller preparing order
- `SHIPPED`: Package picked up (Lalamove webhook: PICKED_UP)
- `DELIVERED`: Package delivered (Lalamove webhook: COMPLETED)
- `COMPLETED`: Buyer confirmed or auto-complete after 7 days

---

### **3. Real-Time Notifications**

✅ **DO:** Send automated notifications at each stage

```javascript
// Payment confirmed
sendEmail(customer, 'Payment Confirmed - Order Being Prepared')

// Package shipped
sendEmail(customer, 'Your Order is On the Way', { trackingLink, driverInfo })

// Package delivered
sendEmail(customer, 'Your Order Has Been Delivered', { deliveryTime })

// Order completed
sendEmail(customer, 'Thank You - Please Rate Your Experience')
```

---

### **4. Buyer Confirmation Period**

✅ **DO:** Add a confirmation period after delivery

```javascript
case 'COMPLETED':
    // Update to DELIVERED first
    await prisma.order.update({
        data: { status: 'DELIVERED' }
    })
    
    // Schedule auto-completion after 7 days
    scheduleAutoComplete(order.id, 7 * 24 * 60 * 60 * 1000)
    break

// After 7 days or buyer confirms
async function completeOrder(orderId) {
    await prisma.order.update({
        where: { id: orderId },
        data: { status: 'COMPLETED' }
    })
}
```

---

### **5. Unified Customer View**

✅ **DO:** Show one clear status to customers

**Good Example (Shopee/Lazada):**
```
Order #12345
Status: Delivered ✅
Delivered on: Dec 3, 2025, 2:00 PM
```

**Bad Example (Current Budolshap):**
```
Order #1
Status: PAID ✅
Delivery: COMPLETED (hidden in details)
```

---

## 🎯 Summary: What's Standard Practice

### **Shopee & Lazada Standard:**

1. ✅ **Automatic status updates** when delivery events occur
2. ✅ **Unified order status** that progresses through lifecycle
3. ✅ **Webhook integration** updates main order status, not just shipping status
4. ✅ **Real-time tracking** with live updates
5. ✅ **Automated notifications** at every stage
6. ✅ **Buyer confirmation period** before final completion
7. ✅ **Single customer-facing status** (not separate payment/delivery statuses)

### **Your Current Implementation:**

1. ✅ **Automatic payment updates** (PayMongo webhook works)
2. ✅ **Webhook integration** (Lalamove webhook works)
3. ⚠️ **Partial status updates** (shipping status updated, order status not)
4. ❌ **Manual final status update** (requires store owner action)
5. ❌ **Status doesn't progress** after payment confirmation

---

## 💡 Recommended Changes

### **Option 1: Full Automation (Shopee/Lazada Style)**

Implement automatic status progression:

```javascript
// File: /app/api/webhooks/lalamove/route.js

case 'PICKED_UP':
    await prisma.order.update({
        where: { id: order.id },
        data: {
            status: 'SHIPPED',  // ✅ Auto-update to SHIPPED
            shippedAt: new Date()
        }
    })
    await sendShippedNotification(order)
    break

case 'COMPLETED':
    await prisma.order.update({
        where: { id: order.id },
        data: {
            status: 'DELIVERED',  // ✅ Auto-update to DELIVERED
            deliveredAt: actualDeliveryTime
        }
    })
    await sendDeliveredNotification(order)
    
    // Schedule auto-completion after 7 days
    scheduleAutoComplete(order.id, 7)
    break
```

### **Option 2: Hybrid Approach**

- Auto-update to `SHIPPED` when picked up
- Auto-update to `DELIVERED` when completed
- Allow manual override if needed
- Add buyer confirmation period

### **Option 3: Keep Current (Not Recommended)**

- Requires manual status updates
- Not aligned with industry standards
- Confusing for customers
- More work for store owners

---

## 📊 Feature Comparison Table

| Feature | Shopee | Lazada | Budolshap (Current) | Recommended |
|---------|--------|--------|---------------------|-------------|
| **Auto Payment Status** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Keep |
| **Auto Shipping Status** | ✅ Yes | ✅ Yes | ✅ Yes (shipping field) | ✅ Keep |
| **Auto Order Status** | ✅ Yes | ✅ Yes | ❌ No | ✅ **Add** |
| **Unified Status** | ✅ Yes | ✅ Yes | ⚠️ Partial | ✅ **Improve** |
| **Real-time Tracking** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Keep |
| **Auto Notifications** | ✅ Yes | ✅ Yes | ⚠️ Partial | ✅ **Add** |
| **Buyer Confirmation** | ✅ Yes | ✅ Yes | ❌ No | ✅ **Add** |
| **Status Progression** | ✅ Full | ✅ Full | ⚠️ Stops at PAID | ✅ **Fix** |

---

## 🎯 Bottom Line

### **What Shopee & Lazada Do:**
✅ Automatically update order status when delivery is completed  
✅ Use unified status that progresses through entire lifecycle  
✅ Webhook updates trigger main order status changes  
✅ Customer sees clear, current status at all times  

### **What Budolshap Currently Does:**
⚠️ Updates shipping status but not order status  
⚠️ Order status stops at "PAID"  
⚠️ Requires manual intervention to mark as delivered  

### **Industry Standard Answer:**
**YES, you should automatically update the order status to "DELIVERED" when Lalamove confirms delivery completion.**

This is the standard practice used by major e-commerce platforms worldwide.

---

## 📚 Sources

- Shopee Open Platform API Documentation
- Lazada Open Platform API Documentation
- E-commerce Order Management Best Practices
- Third-Party Logistics Integration Standards

---

**Document Created:** December 3, 2025  
**Research Date:** December 3, 2025  
**Platforms Analyzed:** Shopee, Lazada  
**Recommendation:** Implement automatic order status updates (Industry Standard)
