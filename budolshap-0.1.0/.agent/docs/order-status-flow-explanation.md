# Order Status Flow Explanation: GCash + Lalamove

## 📋 Overview

This document explains why **Lalamove shows "COMPLETED"** status while **Budolshap shows "PAID"** status for an order placed with GCash payment and Lalamove delivery.

---

## 🔍 The Situation

**What You Observed:**
- **Lalamove Partner Portal**: Order status = `COMPLETED` ✅
- **Budolshap Store Dashboard**: Order status = `PAID` 💰

**Why This Happens:**
These are **two different systems tracking different aspects** of the same order:
- **Lalamove** tracks the **delivery/shipping status**
- **Budolshap** tracks the **overall order status** (including payment)

---

## 🔄 Complete System Process Flow

### **Step 1: Customer Places Order** 🛒

**Location:** Cart/Checkout Page → `/app/api/orders/route.js` (POST)

```javascript
// When customer clicks "Place Order"
1. Customer selects:
   - Products to purchase
   - Delivery address
   - Payment method: GCASH
   - Shipping provider: LALAMOVE

2. Frontend sends order data to API
```

**What Happens:**
```javascript
// File: /app/api/orders/route.js (Lines 217-238)

const order = await tx.order.create({
    data: {
        userId,
        storeId,
        addressId,
        total: finalTotal,
        shippingCost,
        paymentMethod: 'GCASH',
        isPaid: false,              // ❌ Not paid yet
        paymentStatus: 'pending',   // ⏳ Waiting for payment
        status: 'ORDER_PLACED',     // 📦 Initial status
        shipping: {
            provider: 'lalamove',
            quoteId: '...',
            // No bookingId yet - delivery not booked
        }
    }
})
```

**Order Status:** `ORDER_PLACED`
**Payment Status:** `pending`
**isPaid:** `false`

---

### **Step 2: Customer Pays via GCash** 💳

**Location:** Payment Gateway → PayMongo

```javascript
1. Customer is redirected to PayMongo/GCash payment page
2. Customer authorizes payment in GCash app
3. PayMongo creates a "source" (payment authorization)
```

**What Happens:**
- Order is created but **NOT yet paid**
- Customer completes payment in GCash
- PayMongo receives the payment authorization

---

### **Step 3: PayMongo Webhook - Source Chargeable** 🔔

**Location:** `/app/api/webhooks/paymongo/route.js`

**Webhook Event:** `source.chargeable`

```javascript
// File: /app/api/webhooks/paymongo/route.js (Lines 63-97)

async function handleSourceChargeable(data) {
    const sourceId = data.id
    
    // Find order with this source ID
    const order = await prisma.order.findFirst({
        where: { paymentSourceId: sourceId }
    })
    
    // Create payment to capture the funds
    const payment = await createPayment(sourceId, amount)
    
    // Update order
    await prisma.order.update({
        where: { id: order.id },
        data: {
            paymentId: payment.data.id,
            paymentStatus: 'processing'  // ⚙️ Processing payment
        }
    })
}
```

**Order Status:** `ORDER_PLACED`
**Payment Status:** `processing`
**isPaid:** `false`

---

### **Step 4: PayMongo Webhook - Payment Paid** ✅

**Location:** `/app/api/webhooks/paymongo/route.js`

**Webhook Event:** `payment.paid`

```javascript
// File: /app/api/webhooks/paymongo/route.js (Lines 104-178)

async function handlePaymentPaid(data) {
    const paymentId = data.id
    
    // Find order
    const order = await prisma.order.findFirst({
        where: { paymentId: paymentId }
    })
    
    // ✅ MARK ORDER AS PAID
    await prisma.order.update({
        where: { id: order.id },
        data: {
            isPaid: true,           // ✅ Payment confirmed
            status: 'PAID',         // 💰 Status changed to PAID
            paymentStatus: 'paid',
            paidAt: new Date()
        }
    })
    
    // 💵 Credit seller's wallet
    const commissionRate = 0.10
    const commissionAmount = discountedTotal * commissionRate
    const sellerAmount = order.total - commissionAmount
    
    await prisma.wallet.update({
        where: { storeId: order.storeId },
        data: { balance: { increment: sellerAmount } }
    })
    
    // 📝 Create transaction record
    await prisma.transaction.create({
        data: {
            walletId: wallet.id,
            amount: sellerAmount,
            type: 'CREDIT',
            description: `Order #${order.id} Payment (GCash)`
        }
    })
}
```

**Order Status:** `PAID` ✅ ← **THIS IS WHERE BUDOLSHAP STATUS CHANGES**
**Payment Status:** `paid`
**isPaid:** `true`
**Seller Wallet:** Credited with (order total - 10% commission)

---

### **Step 5: Store Owner Books Lalamove Delivery** 🚚

**Location:** Store Dashboard → `/app/api/shipping/lalamove/book/route.js`

```javascript
// When store owner clicks "Book Delivery Now"

1. Store owner views order details
2. Clicks "Book Delivery Now" button
3. System sends booking request to Lalamove
```

**What Happens:**
```javascript
// File: /app/api/shipping/lalamove/book/route.js (Lines 297-350)

// Create Lalamove order
const booking = await lalamove.createOrder(bookingPayload)

// Update Budolshap order with booking details
await prisma.order.update({
    where: { id: orderId },
    data: {
        shipping: {
            ...existingShipping,
            bookingId: booking.orderId,        // Lalamove order ID
            status: 'ASSIGNING_DRIVER',        // Initial Lalamove status
            shareLink: booking.shareLink,
            driverLink: booking.driverLink,
            bookedAt: new Date().toISOString()
        }
    }
})
```

**Order Status in Budolshap:** `PAID` (unchanged)
**Shipping Status:** `ASSIGNING_DRIVER`
**Lalamove Order:** Created with ID `337613168334815740`

---

### **Step 6: Lalamove Assigns Driver** 👨‍✈️

**Location:** Lalamove System → `/app/api/webhooks/lalamove/route.js`

**Webhook Event:** `ON_GOING`

```javascript
// File: /app/api/webhooks/lalamove/route.js (Lines 156-159)

case 'ON_GOING':
    console.log(`Driver assigned to order ${order.id}:`, driver?.name)
    // Updates shipping.status to 'ON_GOING'
    // Updates shipping.driver with driver details
    break
```

**Order Status in Budolshap:** `PAID` (unchanged)
**Shipping Status:** `ON_GOING`
**Driver Info:** Added to order.shipping.driver

---

### **Step 7: Driver Picks Up Package** 📦

**Webhook Event:** `PICKED_UP`

```javascript
// File: /app/api/webhooks/lalamove/route.js (Lines 161-164)

case 'PICKED_UP':
    console.log(`Package picked up for order ${order.id}`)
    // Updates shipping.status to 'PICKED_UP'
    break
```

**Order Status in Budolshap:** `PAID` (unchanged)
**Shipping Status:** `PICKED_UP`

---

### **Step 8: Lalamove Completes Delivery** ✅

**Webhook Event:** `COMPLETED`

```javascript
// File: /app/api/webhooks/lalamove/route.js (Lines 166-170)

case 'COMPLETED':
    console.log(`Order ${order.id} delivered successfully`)
    // Updates shipping.status to 'COMPLETED'
    // Updates shipping.actualDeliveryTime
    // TODO: Update order status to 'DELIVERED'
    break
```

**Order Status in Budolshap:** `PAID` ← **STILL PAID (This is the issue!)**
**Shipping Status:** `COMPLETED` ← **This is what Lalamove shows**

---

## 🎯 Why the Status Difference?

### **Lalamove Partner Portal Shows:**
- **Status:** `COMPLETED` ✅
- **Meaning:** Delivery was successfully completed
- **Tracks:** Shipping/delivery lifecycle only

### **Budolshap Store Dashboard Shows:**
- **Status:** `PAID` 💰
- **Meaning:** Payment was received, but order not yet marked as delivered
- **Tracks:** Overall order lifecycle (payment + fulfillment)

---

## 🔧 The Missing Link

**Current Issue:**
The Lalamove webhook handler **does NOT update the Budolshap order status** when delivery is completed.

**Code Evidence:**
```javascript
// File: /app/api/webhooks/lalamove/route.js (Lines 166-170)

case 'COMPLETED':
    console.log(`Order ${order.id} delivered successfully`)
    // TODO: Send delivery confirmation to customer
    // TODO: Update order status to 'delivered'  ← ❌ NOT IMPLEMENTED
    break
```

**What Should Happen:**
```javascript
case 'COMPLETED':
    // Update order status to DELIVERED
    await prisma.order.update({
        where: { id: order.id },
        data: {
            status: 'DELIVERED',  // ← Should change from PAID to DELIVERED
            deliveredAt: actualDeliveryTime
        }
    })
    break
```

---

## 📊 Complete Status Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CUSTOMER JOURNEY                          │
└─────────────────────────────────────────────────────────────┘

1. Place Order
   ├─ Budolshap Status: ORDER_PLACED
   ├─ Payment Status: pending
   └─ isPaid: false

2. Pay with GCash
   ├─ Budolshap Status: ORDER_PLACED
   ├─ Payment Status: processing
   └─ isPaid: false

3. Payment Confirmed (PayMongo Webhook)
   ├─ Budolshap Status: PAID ✅
   ├─ Payment Status: paid
   ├─ isPaid: true
   └─ Seller Wallet: Credited

4. Store Owner Books Lalamove
   ├─ Budolshap Status: PAID
   ├─ Lalamove Status: ASSIGNING_DRIVER
   └─ Booking ID: Created

5. Driver Assigned
   ├─ Budolshap Status: PAID
   └─ Lalamove Status: ON_GOING

6. Package Picked Up
   ├─ Budolshap Status: PAID
   └─ Lalamove Status: PICKED_UP

7. Delivery Completed
   ├─ Budolshap Status: PAID ← ❌ Should be DELIVERED
   └─ Lalamove Status: COMPLETED ✅

┌─────────────────────────────────────────────────────────────┐
│                    THE DISCONNECT                            │
├─────────────────────────────────────────────────────────────┤
│ Lalamove knows delivery is complete                         │
│ Budolshap doesn't update order status automatically         │
└─────────────────────────────────────────────────────────────┘
```

---

## 💡 Summary

### **What's Happening:**

1. **Two Separate Systems:**
   - **Lalamove**: Tracks delivery status (COMPLETED)
   - **Budolshap**: Tracks order status (PAID)

2. **Payment Flow (Working Correctly):**
   - Customer pays → PayMongo webhook → Order status changes to `PAID`
   - Seller wallet is credited automatically
   - Commission (10%) is deducted

3. **Delivery Flow (Partially Working):**
   - Store owner books delivery → Lalamove creates order
   - Driver picks up → Lalamove updates status
   - Driver delivers → Lalamove marks as `COMPLETED`
   - **BUT** Budolshap order status stays as `PAID` (not updated to `DELIVERED`)

4. **The Missing Piece:**
   - Lalamove webhook receives `COMPLETED` event
   - Webhook updates `order.shipping.status` to `COMPLETED`
   - **BUT** webhook does NOT update `order.status` to `DELIVERED`

### **Why This Design:**

- **Separation of Concerns**: Payment and delivery are independent processes
- **Flexibility**: Allows for different shipping providers
- **Manual Control**: Store owners can verify delivery before marking as complete

### **Current Behavior:**

- ✅ Payment tracking: **Fully automated**
- ⚠️ Delivery tracking: **Semi-automated** (Lalamove updates shipping status, but not order status)
- 👤 Final status update: **Manual** (Store owner must manually update order status)

---

## 🛠️ Possible Improvements

### **Option 1: Automatic Status Update (Recommended)**

Update the Lalamove webhook to automatically change order status:

```javascript
case 'COMPLETED':
    await prisma.order.update({
        where: { id: order.id },
        data: {
            status: 'DELIVERED',
            deliveredAt: actualDeliveryTime
        }
    })
    break
```

### **Option 2: Keep Manual Control**

Require store owners to manually mark orders as delivered after confirming with customer.

### **Option 3: Hybrid Approach**

- Auto-update to `SHIPPED` when driver picks up
- Auto-update to `DELIVERED` when Lalamove confirms delivery
- Allow manual override if needed

---

## 📝 Key Takeaways

1. **Status "PAID" is correct** - Payment was successfully received
2. **Lalamove "COMPLETED" is also correct** - Delivery was completed
3. **They track different things** - Payment vs. Delivery
4. **The webhook works** - It updates shipping status in the order
5. **The order status doesn't auto-update** - This is by design (currently)

---

## 🔗 Related Files

- **Order Creation:** `/app/api/orders/route.js`
- **Payment Webhook:** `/app/api/webhooks/paymongo/route.js`
- **Lalamove Booking:** `/app/api/shipping/lalamove/book/route.js`
- **Lalamove Webhook:** `/app/api/webhooks/lalamove/route.js`
- **Order Status Update:** `/app/api/orders/[orderId]/status/route.js`

---

**Document Created:** December 3, 2025
**System:** Budolshap V2 Multi-vendor E-commerce Platform
