# Lalamove Driver Information Testing Guide

## 🎯 Quick Test

The fix has been deployed. To verify it works:

### Option 1: Wait for Real Order (Recommended)
1. Place a new order on Budolshap with Lalamove delivery
2. Wait for driver assignment
3. Check the order tracking page
4. Driver information should now display

### Option 2: Manual Webhook Test

```bash
# 1. Run the test script
node test-webhook-manual.js send

# 2. Check if driver data was saved
node view-shipping-data.js

# 3. View the order page
# https://budulshap.vercel.app/orders/cmit4cuag0002jx04sbzql9ox
```

### Option 3: Resend from Lalamove Portal
1. Go to [Lalamove Partner Portal - Webhooks](https://partnerportal.lalamove.com/developers/webhooks)
2. Find the DRIVER_ASSIGNED event for order `3379141263827092112`
3. Click "Resend" button
4. Check your order page

---

## 📋 What Was Fixed

### The Problem
There were **TWO webhook endpoints**, but we only fixed ONE:

1. ❌ `/api/webhooks/lalamove` - Fixed first, but NOT being used
2. ✅ `/api/shipping/lalamove/webhook` - **The ACTUAL endpoint** (now fixed!)

### The Bugs Fixed
```javascript
// ❌ BEFORE (was failing)
const orderId = data.orderId;  // Wrong! It's nested in data.order.orderId
const location = data.location;  // Incomplete! Could also be data.driverLocation

// ✅ AFTER (now working)
const lalamoveOrderId = data?.order?.orderId || data?.orderId;
const locationData = data.location || data.driverLocation;
```

### Files Modified
- `app/api/shipping/lalamove/webhook/route.js` - The actual webhook endpoint
- `app/api/webhooks/lalamove/route.js` - Backup endpoint (also fixed)

---

## 🔍 Verification Steps

### 1. Check Database
```bash
node view-shipping-data.js
```

**Expected Output:**
```
✅ Driver information EXISTS in database:
   Name: TestDriver 34567
   Phone: +6310012345467
   Plate: VP9946964
   Vehicle: MOTORCYCLE

✅ Location information EXISTS:
   Lat: 22.329804362923516
   Lng: 114.15004381376369
```

### 2. Check Order Page
Visit: `https://budulshap.vercel.app/orders/cmit4cuag0002jx04sbzql9ox`

**Should Display:**
- ✅ Driver name and photo
- ✅ Phone number with call button
- ✅ Vehicle type and plate number
- ✅ Driver rating
- ✅ GPS location coordinates
- ✅ Live tracking map

### 3. Check Vercel Logs
1. Go to [Vercel Dashboard](https://vercel.com)
2. Select `budolshap` project
3. Go to Logs → Functions
4. Filter for `/api/shipping/lalamove/webhook`
5. Look for recent webhook events

**Expected Log Output:**
```
[Lalamove Webhook] Received event
[Lalamove Webhook] Event: DRIVER_ASSIGNED, Order: 3379141263827092112
[Lalamove Webhook] Updating Internal Order: cmit4cuag0002jx04sbzql9ox
[Lalamove Webhook] Driver info updated: { name: 'TestDriver 34567', ... }
[Lalamove Webhook] Location updated: { lat: 22.32..., lng: 114.15... }
[Lalamove Webhook] Order cmit4cuag0002jx04sbzql9ox updated successfully
[Lalamove Webhook] Status: ON_GOING, Driver: TestDriver 34567
```

---

## 🧪 Test Script Usage

### Basic Usage
```bash
# Show help
node test-webhook-manual.js

# Send test webhook
node test-webhook-manual.js send

# Show how to trigger real webhook
node test-webhook-manual.js help
```

### Configuration
Before running, update these values in `test-webhook-manual.js`:

```javascript
// Your Budolshap order ID
const ORDER_ID = 'cmit4cuag0002jx04sbzql9ox';

// Your Lalamove booking ID
const LALAMOVE_BOOKING_ID = '3379141263827092112';

// Your webhook URL
const WEBHOOK_URL = 'https://budulshap.vercel.app/api/shipping/lalamove/webhook';

// Your webhook secret (from .env)
const WEBHOOK_SECRET = process.env.LALAMOVE_WEBHOOK_SECRET;
```

---

## 🐛 Troubleshooting

### Driver Info Still Not Showing

**1. Check if webhook was received:**
```bash
# Check Vercel logs for webhook events
# Look for: [Lalamove Webhook] Received event
```

**2. Check if order was found:**
```bash
# If you see: "Order not found for Lalamove ID"
# Then the booking ID doesn't match
node debug-booking-id.js
```

**3. Check if driver data was extracted:**
```bash
# Look for: [Lalamove Webhook] Driver info updated
# If missing, the webhook payload structure is different
```

**4. Check database directly:**
```bash
node view-shipping-data.js
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Order not found" | Booking ID mismatch | Check `shipping.bookingId` in database |
| "No driver data" | Webhook payload structure changed | Check Vercel logs for actual payload |
| "Webhook not received" | Wrong endpoint configured | Verify webhook URL in Lalamove Portal |
| "Signature invalid" | Wrong webhook secret | Check `LALAMOVE_WEBHOOK_SECRET` in .env |

---

## 📊 Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Webhook Endpoint | ✅ Fixed | `/api/shipping/lalamove/webhook` |
| Order ID Extraction | ✅ Fixed | Checks both `data.order.orderId` and `data.orderId` |
| Location Extraction | ✅ Fixed | Checks both `data.location` and `data.driverLocation` |
| Driver Data Saving | ✅ Fixed | Properly saves to database |
| UI Display | ✅ Working | LalamoveTracking component |
| Deployment | ✅ Live | Commit: c7e69e9 |

---

## 📝 Test Checklist

Before marking as complete, verify:

- [ ] Webhook is received (check Vercel logs)
- [ ] Order is found in database
- [ ] Driver data is extracted from payload
- [ ] Driver data is saved to database
- [ ] Location data is saved to database
- [ ] Order page displays driver information
- [ ] Phone call button works
- [ ] Live tracking map loads
- [ ] All driver fields are populated (name, phone, plate, vehicle type)

---

## 🚀 Next Steps

1. **Test with manual script:**
   ```bash
   node test-webhook-manual.js send
   ```

2. **Verify in database:**
   ```bash
   node view-shipping-data.js
   ```

3. **Check order page:**
   Visit the order URL and confirm driver info displays

4. **Monitor real orders:**
   Wait for next real order to confirm fix works in production

---

## 📞 Support

If driver information still doesn't show after testing:

1. Check Vercel logs for webhook errors
2. Run `node view-shipping-data.js` to see database state
3. Share the Vercel log output for debugging
4. Verify webhook URL in Lalamove Partner Portal matches:
   ```
   https://budulshap.vercel.app/api/shipping/lalamove/webhook
   ```

---

**Last Updated:** December 6, 2025  
**Fix Version:** c7e69e9  
**Status:** ✅ Deployed and Ready for Testing
