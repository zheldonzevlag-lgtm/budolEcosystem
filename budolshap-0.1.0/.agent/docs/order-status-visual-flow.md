# Visual Order Status Flow - GCash + Lalamove

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    BUDOLSHAP ORDER STATUS FLOW                                ║
║                   GCash Payment + Lalamove Delivery                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: Customer Places Order                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│ 🛒 Customer Action: Clicks "Place Order"                                     │
│                                                                               │
│ ┌─────────────────────────┐         ┌─────────────────────────┐             │
│ │   BUDOLSHAP STATUS      │         │   PAYMENT STATUS        │             │
│ │   ORDER_PLACED          │         │   pending ⏳            │             │
│ │   isPaid: false         │         │                         │             │
│ └─────────────────────────┘         └─────────────────────────┘             │
└──────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: Customer Pays with GCash                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│ 💳 Customer Action: Authorizes payment in GCash app                          │
│                                                                               │
│ ┌─────────────────────────┐         ┌─────────────────────────┐             │
│ │   BUDOLSHAP STATUS      │         │   PAYMENT STATUS        │             │
│ │   ORDER_PLACED          │         │   processing ⚙️         │             │
│ │   isPaid: false         │         │                         │             │
│ └─────────────────────────┘         └─────────────────────────┘             │
└──────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: PayMongo Webhook - Payment Confirmed                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│ 🔔 System Action: PayMongo sends "payment.paid" webhook                      │
│ 💰 System Action: Credits seller wallet (Total - 10% commission)             │
│                                                                               │
│ ┌─────────────────────────┐         ┌─────────────────────────┐             │
│ │   BUDOLSHAP STATUS      │         │   PAYMENT STATUS        │             │
│ │   PAID ✅               │         │   paid ✅               │             │
│ │   isPaid: true          │         │                         │             │
│ └─────────────────────────┘         └─────────────────────────┘             │
│                                                                               │
│ 📝 Seller Wallet Transaction Created:                                        │
│    Amount: ₱12,500 - ₱1,250 (10%) = ₱11,250 credited                        │
└──────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 4: Store Owner Books Lalamove Delivery                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ 👨‍💼 Store Owner Action: Clicks "Book Delivery Now"                           │
│ 🚚 System Action: Creates Lalamove order                                     │
│                                                                               │
│ ┌─────────────────────────┐         ┌─────────────────────────┐             │
│ │   BUDOLSHAP STATUS      │         │   LALAMOVE STATUS       │             │
│ │   PAID ✅               │         │   ASSIGNING_DRIVER 🔍  │             │
│ └─────────────────────────┘         └─────────────────────────┘             │
│                                                                               │
│ 📦 Lalamove Booking ID: 337613168334815740                                   │
└──────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 5: Driver Assigned                                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ 🔔 Lalamove Webhook: "ON_GOING" event                                        │
│ 👨‍✈️ Driver Info: Added to order                                              │
│                                                                               │
│ ┌─────────────────────────┐         ┌─────────────────────────┐             │
│ │   BUDOLSHAP STATUS      │         │   LALAMOVE STATUS       │             │
│ │   PAID ✅               │         │   ON_GOING 🚗           │             │
│ └─────────────────────────┘         └─────────────────────────┘             │
└──────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 6: Package Picked Up                                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│ 🔔 Lalamove Webhook: "PICKED_UP" event                                       │
│ 📦 Driver has the package                                                    │
│                                                                               │
│ ┌─────────────────────────┐         ┌─────────────────────────┐             │
│ │   BUDOLSHAP STATUS      │         │   LALAMOVE STATUS       │             │
│ │   PAID ✅               │         │   PICKED_UP 📦          │             │
│ └─────────────────────────┘         └─────────────────────────┘             │
└──────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 7: Delivery Completed                                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│ 🔔 Lalamove Webhook: "COMPLETED" event                                       │
│ ✅ Package delivered to customer                                             │
│                                                                               │
│ ┌─────────────────────────┐         ┌─────────────────────────┐             │
│ │   BUDOLSHAP STATUS      │         │   LALAMOVE STATUS       │             │
│ │   PAID ✅               │         │   COMPLETED ✅          │             │
│ │   (NOT DELIVERED!)      │         │                         │             │
│ └─────────────────────────┘         └─────────────────────────┘             │
│                                                                               │
│ ⚠️  THE DISCONNECT:                                                          │
│    - Lalamove knows delivery is complete                                     │
│    - Budolshap order status is NOT automatically updated to DELIVERED        │
│    - Webhook updates shipping.status but NOT order.status                    │
└──────────────────────────────────────────────────────────────────────────────┘


╔══════════════════════════════════════════════════════════════════════════════╗
║                           WHAT YOU SEE                                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────┐  ┌─────────────────────────────────────┐
│  LALAMOVE PARTNER PORTAL            │  │  BUDOLSHAP STORE DASHBOARD          │
├─────────────────────────────────────┤  ├─────────────────────────────────────┤
│                                     │  │                                     │
│  Order ID: 337613168334815740       │  │  Order #1                           │
│                                     │  │                                     │
│  Status: COMPLETED ✅               │  │  Status: PAID ✅                    │
│                                     │  │                                     │
│  Meaning:                           │  │  Meaning:                           │
│  - Delivery was completed           │  │  - Payment was received             │
│  - Driver marked as delivered       │  │  - Seller wallet credited           │
│  - Package reached customer         │  │  - Order awaiting fulfillment       │
│                                     │  │                                     │
│  Tracks: SHIPPING ONLY              │  │  Tracks: ENTIRE ORDER LIFECYCLE     │
│                                     │  │                                     │
└─────────────────────────────────────┘  └─────────────────────────────────────┘


╔══════════════════════════════════════════════════════════════════════════════╗
║                        WHY THIS HAPPENS                                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

1. TWO SEPARATE SYSTEMS
   ├─ Lalamove: External delivery service
   ├─ Budolshap: Your e-commerce platform
   └─ They communicate via webhooks but track different things

2. DIFFERENT PURPOSES
   ├─ Lalamove tracks: Delivery lifecycle (driver, pickup, delivery)
   ├─ Budolshap tracks: Order lifecycle (payment, fulfillment, completion)
   └─ Both are correct for what they track

3. WEBHOOK BEHAVIOR
   ├─ Lalamove sends "COMPLETED" webhook
   ├─ Budolshap receives webhook
   ├─ Updates: order.shipping.status = "COMPLETED"
   └─ Does NOT update: order.status (stays as "PAID")

4. BY DESIGN (CURRENTLY)
   ├─ Payment status: Fully automated via PayMongo webhook
   ├─ Delivery tracking: Semi-automated via Lalamove webhook
   └─ Final order status: Requires manual update or additional logic


╔══════════════════════════════════════════════════════════════════════════════╗
║                     TECHNICAL EXPLANATION                                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

ORDER DATA STRUCTURE:
{
  id: "order-123",
  status: "PAID",                    ← Main order status (Budolshap)
  paymentStatus: "paid",             ← Payment status
  isPaid: true,                      ← Payment confirmed
  
  shipping: {
    provider: "lalamove",
    bookingId: "337613168334815740",
    status: "COMPLETED",             ← Lalamove delivery status
    driver: { ... },
    timeline: [
      { event: "ASSIGNING_DRIVER", timestamp: "..." },
      { event: "ON_GOING", timestamp: "..." },
      { event: "PICKED_UP", timestamp: "..." },
      { event: "COMPLETED", timestamp: "..." }
    ]
  }
}

WHAT GETS UPDATED:
✅ shipping.status = "COMPLETED"     (Updated by Lalamove webhook)
❌ status = "DELIVERED"              (NOT updated automatically)


╔══════════════════════════════════════════════════════════════════════════════╗
║                         SOLUTION OPTIONS                                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

OPTION 1: Automatic Status Update (Recommended)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Modify Lalamove webhook to auto-update order status:

case 'COMPLETED':
    await prisma.order.update({
        where: { id: order.id },
        data: {
            status: 'DELIVERED',           ← Auto-update to DELIVERED
            deliveredAt: actualDeliveryTime
        }
    })

Pros: Fully automated, real-time status updates
Cons: Less control, assumes Lalamove data is always accurate


OPTION 2: Keep Manual Control
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Store owner manually marks as delivered after verification

Pros: More control, can verify with customer first
Cons: Requires manual action, potential delays


OPTION 3: Hybrid Approach (Best of Both)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Auto-update to "SHIPPED" when driver picks up
- Auto-update to "DELIVERED" when Lalamove confirms delivery
- Allow manual override if needed
- Send notification to store owner for verification

Pros: Automated + control, best user experience
Cons: More complex implementation


╔══════════════════════════════════════════════════════════════════════════════╗
║                         KEY TAKEAWAYS                                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

✅ Both statuses are CORRECT
   - Lalamove: COMPLETED (delivery done)
   - Budolshap: PAID (payment received)

✅ System is working as designed
   - Payment webhook: Fully automated ✅
   - Delivery webhook: Updates shipping status ✅
   - Order status: Requires additional logic or manual update

✅ This is a feature, not a bug
   - Allows verification before final status update
   - Prevents premature "delivered" status
   - Gives store owners control

⚠️  Consider implementing automatic status update
   - Improves user experience
   - Reduces manual work
   - Provides real-time order tracking


╔══════════════════════════════════════════════════════════════════════════════╗
║                      RELATED CODE FILES                                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

📁 /app/api/orders/route.js
   → Order creation logic
   → Sets initial status to ORDER_PLACED
   → Sets isPaid to false

📁 /app/api/webhooks/paymongo/route.js
   → Handles PayMongo webhooks
   → Updates status to PAID when payment confirmed
   → Credits seller wallet

📁 /app/api/shipping/lalamove/book/route.js
   → Books Lalamove delivery
   → Creates Lalamove order
   → Updates order.shipping with booking details

📁 /app/api/webhooks/lalamove/route.js
   → Handles Lalamove webhooks
   → Updates order.shipping.status
   → Does NOT update order.status (current behavior)

📁 /app/api/orders/[orderId]/status/route.js
   → Manual status update endpoint
   → Used by store owners to change order status
```

**Created:** December 3, 2025  
**System:** Budolshap V2 Multi-vendor E-commerce Platform  
**Author:** Antigravity AI Assistant
