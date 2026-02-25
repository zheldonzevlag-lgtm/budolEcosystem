# 🚀 GCash Payment Quick Reference

## 📋 Environment Variables

```env
PAYMONGO_SECRET_KEY=sk_test_xxxxx
PAYMONGO_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## 🔗 Important URLs

| Purpose | URL |
|---------|-----|
| PayMongo Dashboard | https://dashboard.paymongo.com |
| API Keys | https://dashboard.paymongo.com/developers/api-keys |
| Webhooks | https://dashboard.paymongo.com/developers/webhooks |
| Documentation | https://developers.paymongo.com |

## 📡 Webhook Configuration

**Webhook URL (Development):**
```
https://your-ngrok-url.ngrok.io/api/webhooks/paymongo
```

**Webhook URL (Production):**
```
https://yourdomain.com/api/webhooks/paymongo
```

**Events to Subscribe:**
- ✅ `source.chargeable`
- ✅ `payment.paid`
- ✅ `payment.failed`

## 🧪 Testing with ngrok

```bash
# Terminal 1: Start your app
npm run dev

# Terminal 2: Start ngrok
ngrok http 3000

# Copy the ngrok URL (e.g., https://abc123.ngrok.io)
# Add to PayMongo webhook: https://abc123.ngrok.io/api/webhooks/paymongo
```

## 🔍 Debugging Checklist

### Order Not Marked as Paid?
- [ ] Webhook URL is correct in PayMongo dashboard
- [ ] ngrok is running (for development)
- [ ] `PAYMONGO_WEBHOOK_SECRET` matches PayMongo dashboard
- [ ] Check server logs for webhook events
- [ ] Verify webhook signature validation passed

### Payment Link Not Generated?
- [ ] `PAYMONGO_SECRET_KEY` is correct
- [ ] API key is for correct mode (test/live)
- [ ] Billing address is complete
- [ ] Check server logs for API errors

### Webhook Signature Failed?
- [ ] `PAYMONGO_WEBHOOK_SECRET` is correct
- [ ] No extra spaces in `.env` file
- [ ] Webhook secret starts with `whsec_`

## 💡 Quick Tips

1. **Test Mode vs Live Mode**
   - Test keys start with `sk_test_`
   - Live keys start with `sk_live_`
   - Use test mode for development

2. **Webhook Retries**
   - PayMongo retries failed webhooks
   - Always return 200 status
   - Log errors for debugging

3. **Payment Amount**
   - PayMongo uses centavos (₱100 = 10000)
   - Conversion handled automatically

4. **Commission**
   - Platform takes 10% commission
   - Calculated on product total (excluding shipping)
   - Seller gets 90% + full shipping cost

## 📊 Order Status Flow

```
ORDER_PLACED → PAID → PROCESSING → SHIPPED → DELIVERED
                ↓
         (Webhook confirms)
```

## 🎯 Key Files

| File | Purpose |
|------|---------|
| `lib/paymongo.js` | PayMongo client library |
| `app/api/payment/gcash/create/route.js` | Create payment source |
| `app/api/webhooks/paymongo/route.js` | Handle webhooks |
| `app/payment/success/page.jsx` | Success page |
| `app/payment/failed/page.jsx` | Failed page |
| `components/OrderSummary.jsx` | Checkout flow |

## 🔐 Security Reminders

- ❌ Never commit `.env` file
- ❌ Never expose API keys in frontend
- ❌ Never skip webhook signature verification
- ✅ Always use HTTPS in production
- ✅ Always validate payment amounts
- ✅ Always log webhook events

## 📞 Support Contacts

- **PayMongo Support:** support@paymongo.com
- **PayMongo Docs:** https://developers.paymongo.com
- **GCash Business:** https://www.gcash.com/business

---

**Last Updated:** November 23, 2024
