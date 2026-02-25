# Order Status Management - Store Owner Guide

## 📊 Order Status Flow

```
ORDER_PLACED / PAID
        ↓
   PROCESSING  ← Store prepares the order
        ↓
     SHIPPED   ← Store ships the order
        ↓
    DELIVERED  ← Order delivered to customer
```

## 🔄 Status Transitions

### What Changed:
The status dropdown has been improved to make it clearer what action you're taking:

**Before:**
- Dropdown showed: "PAID" and "PROCESSING" (confusing!)

**After:**
- Dropdown shows: 
  - "Current: PAID" (disabled, just shows current status)
  - "→ Mark as PROCESSING" (action you can take)

## 📋 Status Definitions

### ORDER_PLACED
- **When:** Order is created but not yet paid
- **Next Action:** Wait for payment or mark as PROCESSING if COD

### PAID
- **When:** Payment confirmed (GCash) or COD order placed
- **Next Action:** Mark as PROCESSING when you start preparing the order
- **Dropdown shows:** "→ Mark as PROCESSING"

### PROCESSING
- **When:** You're preparing/packing the order
- **Next Action:** Mark as SHIPPED when you hand it to courier
- **Dropdown shows:** "→ Mark as SHIPPED"

### SHIPPED
- **When:** Order is with courier/in transit
- **Next Action:** Mark as DELIVERED when customer receives it
- **Dropdown shows:** "→ Mark as DELIVERED"

### DELIVERED
- **When:** Customer has received the order
- **Next Action:** None (final status)
- **Dropdown shows:** Status badge (no dropdown)

## 🚚 Lalamove Orders (Special Case)

For orders with Lalamove delivery that have been booked:

- Status shows as: **"PROCESSING (Auto)"** or **"SHIPPED (Auto)"**
- Status is updated automatically via Lalamove webhooks
- You cannot manually change the status
- Status updates based on driver progress:
  - Driver assigned → PROCESSING
  - Driver picked up → SHIPPED
  - Driver delivered → DELIVERED

## ✅ How to Update Status

1. **Find the order** in your Store Orders page
2. **Click the dropdown** in the Status column
3. **See current status** (disabled, grayed out)
4. **Select next action** (e.g., "→ Mark as PROCESSING")
5. **Status updates automatically** - page refreshes

## ⚠️ Important Notes

- **Cannot change status backwards** (e.g., from SHIPPED to PROCESSING)
- **Final statuses** (DELIVERED, CANCELLED, REFUNDED) cannot be changed
- **Lalamove orders** update automatically - no manual changes needed
- **Always update status** to keep customers informed

## 🎯 Best Practices

1. **Mark as PROCESSING** as soon as you start preparing the order
2. **Mark as SHIPPED** when you hand it to courier (or book Lalamove)
3. **Mark as DELIVERED** only when customer confirms receipt
4. **For Lalamove:** Just book the delivery - status updates automatically

## 📱 Customer Notifications

When you update status, customers receive:
- Email notification
- Status update in their Orders page
- Tracking information (if applicable)

## 🔧 Troubleshooting

**Q: I don't see any options in the dropdown**
- **A:** The order is at a final status (DELIVERED, CANCELLED, REFUNDED)

**Q: Dropdown only shows current status**
- **A:** This is normal - current status is disabled. Look for options with "→" arrow

**Q: Can I skip statuses?**
- **A:** No, you must follow the progression: PAID → PROCESSING → SHIPPED → DELIVERED

**Q: Lalamove order stuck at PROCESSING**
- **A:** Wait for driver to pick up. Status updates automatically via webhook

**Q: How do I cancel an order?**
- **A:** Contact admin or use the return/refund system
