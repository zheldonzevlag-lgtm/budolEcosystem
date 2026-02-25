# 🧪 Testing Scripts - Quick Reference

## 🚀 Quick Test (Recommended)

Run everything in one command:

```bash
node quick-test.js
```

This will:
1. ✅ Send test webhook to production
2. ⏳ Wait for processing
3. 🔍 Check database for driver data
4. 📊 Show results

---

## 📋 Individual Test Scripts

### 1. Manual Webhook Test
```bash
# Show usage
node test-webhook-manual.js

# Send test webhook
node test-webhook-manual.js send

# Show how to trigger real webhook
node test-webhook-manual.js help
```

### 2. Check Database
```bash
# View shipping data for current order
node view-shipping-data.js

# Check if order can be found by booking ID
node debug-booking-id.js

# Check specific order's driver data
node check-driver-data.js
```

---

## 📖 Full Documentation

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for:
- Detailed testing instructions
- Verification steps
- Troubleshooting guide
- Complete checklist

---

## ⚙️ Configuration

Before testing, make sure these are set correctly:

### In Scripts
- `ORDER_ID` - Your Budolshap order ID
- `LALAMOVE_BOOKING_ID` - Lalamove order ID from database
- `WEBHOOK_URL` - Production or local webhook endpoint

### In Environment
```bash
# .env file
LALAMOVE_WEBHOOK_SECRET=your-webhook-secret-here
```

---

## ✅ Expected Results

After running the test, you should see:

```
✅ DRIVER DATA FOUND:
   Name: TestDriver 34567
   Phone: +6310012345467
   Plate: VP9946964
   Vehicle: MOTORCYCLE
   Rating: 4.8

✅ LOCATION DATA FOUND:
   Lat: 22.329804362923516
   Lng: 114.15004381376369
```

Then visit your order page to see the driver information displayed!

---

## 🐛 If Test Fails

1. **Check Vercel logs** - Look for webhook errors
2. **Verify webhook URL** - Should be `/api/shipping/lalamove/webhook`
3. **Check webhook secret** - Must match Lalamove configuration
4. **Review payload structure** - Compare with actual Lalamove webhooks

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for detailed troubleshooting.

---

## 📁 Script Files

| Script | Purpose |
|--------|---------|
| `quick-test.js` | All-in-one test (recommended) |
| `test-webhook-manual.js` | Manual webhook sender |
| `view-shipping-data.js` | View order shipping data |
| `debug-booking-id.js` | Debug order lookup |
| `check-driver-data.js` | Check driver data in DB |

---

**Ready to test?** Run: `node quick-test.js`
