# Payment Methods - COD vs GCash

## 📋 Overview

Your platform now supports **two payment methods**, each with different payment confirmation flows:

1. **COD (Cash on Delivery)** - Traditional cash payment
2. **GCash** - Digital wallet payment via PayMongo

---

## 💵 COD (Cash on Delivery) Flow

### **How It Works:**

```
1. User selects COD at checkout
   ↓
2. Order created:
   - isPaid: false
   - status: ORDER_PLACED
   - paymentStatus: 'cod_pending'
   ↓
3. User redirected to orders page
   ↓
4. Seller processes and ships order
   ↓
5. Seller delivers order
   ↓
6. Seller receives cash from buyer
   ↓
7. Seller marks order as DELIVERED
   ↓
8. System automatically:
   - Sets isPaid: true
   - Sets paymentStatus: 'cod_paid'
   - Sets paidAt: timestamp
   - Credits seller wallet (90% after 10% commission)
   - Creates transaction record
```

### **Key Features:**

✅ **No upfront payment required**  
✅ **Automatic wallet credit on delivery**  
✅ **Seller confirms payment by marking as delivered**  
✅ **Same commission structure as GCash (10%)**  
✅ **Transaction history tracked**

### **For Sellers:**

When you deliver a COD order:
1. Go to Store Dashboard → Orders
2. Find the order
3. Click "Mark as Delivered"
4. Your wallet is **automatically credited** with the payment (minus 10% commission)

---

## 💳 GCash Payment Flow

### **How It Works:**

```
1. User selects GCash at checkout
   ↓
2. Order created:
   - isPaid: false
   - status: ORDER_PLACED
   - paymentStatus: 'pending'
   ↓
3. User redirected to GCash checkout page
   ↓
4. User authorizes payment in GCash app
   ↓
5. PayMongo sends webhook to server
   ↓
6. System automatically:
   - Sets isPaid: true
   - Sets status: PAID
   - Sets paymentStatus: 'paid'
   - Sets paidAt: timestamp
   - Credits seller wallet (90% after 10% commission)
   - Creates transaction record
   ↓
7. User redirected to success page
```

### **Key Features:**

✅ **Instant payment confirmation**  
✅ **Webhook-based verification (secure)**  
✅ **Automatic wallet credit on payment**  
✅ **No manual confirmation needed**  
✅ **Same commission structure as COD (10%)**

---

## 📊 Comparison Table

| Feature | COD | GCash |
|---------|-----|-------|
| **Payment Timing** | On delivery | Immediately |
| **Confirmation** | Manual (seller) | Automatic (webhook) |
| **Wallet Credit** | On delivery | On payment |
| **Risk** | Buyer may refuse | No risk |
| **Setup Required** | None | PayMongo account |
| **Commission** | 10% | 10% |
| **Transaction Fee** | None | PayMongo fees apply |

---

## 💰 Earnings Dashboard

Both payment methods are tracked in the seller dashboard:

### **Pending Earnings:**
- **COD**: Orders that are SHIPPED but not yet DELIVERED
- **GCash**: Orders that are PAID but not yet DELIVERED

### **Total Earnings:**
- **COD**: Orders marked as DELIVERED (payment received)
- **GCash**: Orders marked as DELIVERED

### **Why Delivery Confirmation?**

Following e-commerce best practices:
- Protects buyers (ensures they receive items)
- Allows return window
- Reduces disputes
- Builds platform trust

---

## 🔄 Order Status Flow

### **COD Orders:**
```
ORDER_PLACED → PROCESSING → SHIPPED → DELIVERED
                                         ↓
                                   (isPaid: true)
                                   (Wallet credited)
```

### **GCash Orders:**
```
ORDER_PLACED → PAID → PROCESSING → SHIPPED → DELIVERED
                ↓
         (isPaid: true)
         (Wallet credited)
```

---

## 🎯 Commission Structure

Both payment methods use the **same commission calculation**:

```javascript
Product Total: ₱1,000
Shipping Cost: ₱100
Order Total: ₱1,100

Commission (10% of product total): ₱100
Seller Receives: ₱1,000 (₱1,100 - ₱100)
```

**Note:** Commission is calculated on the **product total only**, not including shipping costs.

---

## ✅ Testing Both Methods

### **Test COD:**
1. Add products to cart
2. Select COD payment method
3. Complete checkout
4. Go to Store Dashboard → Orders
5. Mark order as DELIVERED
6. Check wallet balance increased

### **Test GCash:**
1. Add products to cart
2. Select GCash payment method
3. Complete checkout
4. Complete payment in GCash (test mode)
5. Verify webhook processed
6. Check order marked as PAID
7. Check wallet balance increased

---

## 🔐 Security Notes

### **COD:**
- ✅ Wallet only credited when seller confirms delivery
- ✅ Prevents crediting for cancelled/returned orders
- ✅ Seller has full control over payment confirmation

### **GCash:**
- ✅ Webhook signature verification
- ✅ Server-side payment validation
- ✅ No client-side confirmation
- ✅ Cryptographically secure

---

## 📝 Summary

**Both payment methods are fully functional:**

✅ **COD** - Works out of the box, no setup required  
✅ **GCash** - Requires PayMongo account setup  
✅ **Same commission** - 10% platform fee  
✅ **Automatic wallet credit** - For both methods  
✅ **Delivery-based earnings** - Industry best practice  
✅ **Transaction tracking** - Full history for both  

---

**Last Updated:** November 23, 2024
