# Complete Order Flow Testing Instructions
## GCash Payment + Lalamove Delivery Integration

---

## 📋 Overview

This document provides instructions for testing the complete end-to-end order flow in Budolshap, including:
- ✅ Order placement
- ✅ GCash payment processing
- ✅ Lalamove delivery booking
- ✅ Driver assignment and tracking
- ✅ Delivery completion

---

## 🎯 Test Objectives

1. Verify that users can place orders with GCash payment
2. Confirm payment webhooks update order status correctly
3. Ensure Lalamove orders are created and visible in Partner Portal
4. Validate driver assignment and tracking functionality
5. Confirm delivery completion updates order status

---

## 📚 Testing Resources

### 1. **Visual Test Guide** (Recommended)
Open in browser: `COMPLETE_ORDER_FLOW_TEST_GUIDE.html`

This comprehensive HTML guide includes:
- Step-by-step instructions with visual design
- Prerequisites checklist
- Verification checklist
- Troubleshooting section
- Success criteria

### 2. **Automated Test Script**
Run: `node test-complete-order-flow.js`

**Note:** This script requires:
- Valid test user credentials (update in script)
- Running dev server
- Manual GCash payment completion step

---

## 🚀 Quick Start - Manual Testing

### Prerequisites
- [ ] Dev server running (`npm run dev`)
- [ ] Lalamove credentials configured in `.env.local`
- [ ] PayMongo credentials configured in `.env.local`
- [ ] Test user account created
- [ ] Store with products available
- [ ] Delivery address saved

### Step-by-Step Process

#### 1. **Login**
```
URL: http://localhost:3000/login
Credentials: Your test user account
```

#### 2. **Add Products to Cart**
```
URL: http://localhost:3000/products
Action: Select products and add to cart
```

#### 3. **Proceed to Checkout**
```
URL: http://localhost:3000/cart
Action: Review cart and click "Proceed to Checkout"
```

#### 4. **Select Delivery Address**
- Choose existing address or add new one
- Ensure address is within Metro Manila for Lalamove

#### 5. **Get Lalamove Quote**
- Click "Get Lalamove Quote"
- Wait for quote to load
- Verify price and ETA displayed

#### 6. **Select GCash Payment**
- Choose "GCash" as payment method
- Review order total (items + shipping)

#### 7. **Place Order**
- Click "Place Order"
- Should redirect to PayMongo/GCash checkout

#### 8. **Complete Payment**
- Follow GCash payment flow
- Complete payment (or use test mode)
- Wait for redirect back to app

#### 9. **Verify Payment Status**
```
URL: http://localhost:3000/orders
Expected: Order shows as "Paid"
```

#### 10. **Book Lalamove Delivery** (Store Owner)
```
URL: http://localhost:3000/store/orders
Action: Click "Book Delivery Now" for the paid order
```

⚠️ **WARNING:** This creates a real Lalamove order!

#### 11. **Verify in Lalamove Portal**
```
URL: https://partnerportal.lalamove.com/records
Expected: Order visible in records
```

#### 12. **Monitor Driver Assignment**
- Watch for status change to "ACCEPTED"
- Driver details should appear

#### 13. **Track Delivery**
- Use tracking link in app
- Monitor status updates

#### 14. **Verify Completion**
- Lalamove status: "COMPLETED"
- App order status: "delivered"

---

## ✅ Verification Checklist

### Database Checks
- [ ] Order created with correct items
- [ ] Total amount includes shipping cost
- [ ] Payment method is "GCASH"
- [ ] Shipping info includes Lalamove quotationId and stopIds

### Payment Verification
- [ ] PayMongo source created
- [ ] Checkout URL generated
- [ ] Payment webhook received
- [ ] Order isPaid updated to true
- [ ] Payment status changed to "paid"

### Lalamove Verification
- [ ] Quote received with valid quotationId
- [ ] Quote includes pickup and delivery stopIds
- [ ] Order created in Lalamove system
- [ ] Order visible in Partner Portal
- [ ] Order details match (addresses, contact info)

### Delivery Tracking
- [ ] Driver assigned to order
- [ ] Driver details visible (name, phone, vehicle)
- [ ] Status updates received via webhooks
- [ ] Tracking link accessible
- [ ] Real-time location updates (if available)

### Completion
- [ ] Delivery marked as completed in Lalamove
- [ ] Order status updated to "delivered" in app
- [ ] Completion timestamp recorded
- [ ] Notifications sent to customer and store

---

## 🔧 Troubleshooting

### Issue: Order not in Lalamove Portal

**Symptoms:**
- Order created in Budolshap
- Payment completed
- "Book Delivery" clicked
- Order NOT visible in Lalamove Partner Portal

**Possible Causes:**
1. Missing stopIds in booking request
2. Invalid Lalamove API credentials
3. Insufficient wallet credit
4. Address outside service area

**Solutions:**
1. Check browser console for API errors
2. Verify `.env.local` has correct `LALAMOVE_CLIENT_ID` and `LALAMOVE_CLIENT_SECRET`
3. Check Lalamove wallet balance in Partner Portal
4. Ensure addresses are within Metro Manila
5. Check server logs for detailed error messages

**Debug Steps:**
```bash
# Check Lalamove service logs
# Look for API request/response in terminal where dev server is running

# Test Lalamove connection
node test-lalamove-order-creation.js
```

---

### Issue: Payment Not Updating Order

**Symptoms:**
- Payment completed in GCash
- Order still shows as "pending"
- isPaid still false

**Possible Causes:**
1. Webhook not configured in PayMongo dashboard
2. Webhook endpoint not accessible
3. Webhook signature verification failing
4. Local development without ngrok

**Solutions:**
1. Configure webhook in PayMongo dashboard
2. For local testing, use ngrok to expose localhost
3. Verify webhook secret in `.env.local`
4. Check webhook handler logs

**Webhook Setup:**
```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000

# Add webhook in PayMongo dashboard:
# URL: https://your-ngrok-url.ngrok.io/api/webhooks/paymongo
# Events: source.chargeable, payment.paid
```

---

### Issue: Driver Not Assigned

**Symptoms:**
- Order created in Lalamove
- Status stuck at "ASSIGNING_DRIVER"
- No driver details

**Possible Causes:**
1. Using sandbox mode (simulated)
2. No drivers available
3. Outside service hours
4. Pickup/delivery too far apart

**Solutions:**
1. **Sandbox Mode:** Driver assignment is simulated, may take time
2. **Production:** Wait for available drivers (can take 5-15 minutes)
3. Check Lalamove service hours
4. Try addresses closer together

---

### Issue: Quote Expired

**Symptoms:**
- Error when placing order
- "Invalid quote" or "Quote expired" message

**Cause:**
- Lalamove quotes expire after a certain time (typically 10-15 minutes)

**Solution:**
- Request a new quote before placing order
- Complete checkout faster
- Consider implementing quote refresh logic

---

## 📊 Expected API Flow

```
1. User places order
   POST /api/orders
   → Creates order with paymentStatus: "pending"

2. Create GCash payment
   POST /api/payment/gcash/create
   → Returns checkout URL

3. User completes payment
   → PayMongo processes payment

4. Payment webhook received
   POST /api/webhooks/paymongo
   → Updates order: isPaid: true, paymentStatus: "paid"

5. Store books Lalamove
   POST /api/shipping/lalamove/book
   → Creates Lalamove order

6. Lalamove webhooks
   POST /api/webhooks/lalamove
   → Updates order status based on delivery progress
```

---

## 🎯 Success Criteria

The test is **SUCCESSFUL** when:

✅ Order created in Budolshap database  
✅ GCash payment completed successfully  
✅ Payment webhook updated order to "paid"  
✅ Lalamove order visible in Partner Portal  
✅ Order details match in both systems  
✅ Driver assigned to delivery  
✅ Real-time tracking available  
✅ Status updates received via webhooks  
✅ Delivery completed successfully  
✅ Final order status is "delivered"  

---

## 📝 Test Data

### Test Addresses (Metro Manila)

**Pickup (Store):**
```
Address: Manila City Hall, Arroceros St, Ermita, Manila
Coordinates: 14.5995, 120.9842
```

**Delivery (Customer):**
```
Address: Makati City Hall, J.P. Rizal Ave, Poblacion, Makati
Coordinates: 14.5547, 121.0244
```

### Test Contact Numbers
```
Pickup: +639171234567
Delivery: +639177654321
```

**Note:** Use valid Philippine mobile numbers in production.

---

## 🔐 Environment Variables Required

```env
# Lalamove
LALAMOVE_CLIENT_ID=your_client_id
LALAMOVE_CLIENT_SECRET=your_client_secret
LALAMOVE_ENV=sandbox  # or production
LALAMOVE_WEBHOOK_SECRET=your_webhook_secret

# PayMongo
PAYMONGO_SECRET_KEY=your_secret_key
PAYMONGO_PUBLIC_KEY=your_public_key

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## 📞 Support Resources

### Lalamove
- Partner Portal: https://partnerportal.lalamove.com/
- API Documentation: https://developers.lalamove.com/
- Support: Check Partner Portal for contact info

### PayMongo
- Dashboard: https://dashboard.paymongo.com/
- API Documentation: https://developers.paymongo.com/
- Support: support@paymongo.com

---

## 🎬 Next Steps After Successful Test

1. **Document Results**
   - Take screenshots of each step
   - Note any issues encountered
   - Record timing (quote to delivery completion)

2. **Production Readiness**
   - Switch to production API credentials
   - Configure production webhooks
   - Test with real payment (small amount)
   - Verify with actual delivery

3. **User Acceptance Testing**
   - Have actual users test the flow
   - Gather feedback on UX
   - Identify pain points
   - Optimize checkout process

4. **Monitoring Setup**
   - Set up error tracking (Sentry, etc.)
   - Monitor webhook success rates
   - Track payment completion rates
   - Monitor delivery success rates

---

## 📄 Related Documentation

- `LALAMOVE_PHASE5_COMPLETE_DOCUMENTATION.html` - Lalamove integration details
- `COMPLETE_ORDER_FLOW_TEST_GUIDE.html` - Visual testing guide
- `test-complete-order-flow.js` - Automated test script
- `test-lalamove-order-creation.js` - Lalamove-specific test

---

**Last Updated:** 2025-11-29  
**Version:** 1.0  
**Status:** Ready for Testing
