# GCash Payment Integration Guide (PayMongo)

This guide will help you set up GCash payments using PayMongo for your e-commerce platform.

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [PayMongo Account Setup](#paymongo-account-setup)
3. [Environment Configuration](#environment-configuration)
4. [Webhook Setup](#webhook-setup)
5. [Testing](#testing)
6. [Going Live](#going-live)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Prerequisites

- Active PayMongo account
- GCash business account (for production)
- SSL certificate (required for webhooks in production)
- Node.js and npm installed

---

## 🏦 PayMongo Account Setup

### Step 1: Create PayMongo Account
1. Go to [https://dashboard.paymongo.com/signup](https://dashboard.paymongo.com/signup)
2. Sign up with your business email
3. Complete the verification process
4. Submit required business documents (for production)

### Step 2: Get API Keys
1. Log in to [PayMongo Dashboard](https://dashboard.paymongo.com)
2. Navigate to **Developers** → **API Keys**
3. Copy your **Secret Key** (starts with `sk_test_` for test mode)
4. Keep these keys secure - never commit them to Git!

---

## ⚙️ Environment Configuration

### Step 1: Add Environment Variables

Add these to your `.env` file:

```env
# PayMongo API Keys
PAYMONGO_SECRET_KEY=sk_test_your_secret_key_here
PAYMONGO_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Application URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Step 2: Verify Installation

The following packages should already be installed:
- `paymongo` - PayMongo Node.js SDK

If not, run:
```bash
npm install paymongo
```

---

## 🔗 Webhook Setup

Webhooks are **CRITICAL** for payment confirmation. Without webhooks, payments won't be marked as paid!

### Step 1: Expose Local Server (For Development)

Use **ngrok** to expose your local server:

```bash
# Install ngrok
npm install -g ngrok

# Expose port 3000
ngrok http 3000
```

You'll get a URL like: `https://abc123.ngrok.io`

### Step 2: Create Webhook in PayMongo

1. Go to [PayMongo Dashboard](https://dashboard.paymongo.com) → **Developers** → **Webhooks**
2. Click **Create Webhook**
3. Enter your webhook URL:
   - **Development**: `https://your-ngrok-url.ngrok.io/api/webhooks/paymongo`
   - **Production**: `https://yourdomain.com/api/webhooks/paymongo`
4. Select these events:
   - ✅ `source.chargeable` - When user authorizes GCash payment
   - ✅ `payment.paid` - When payment is successful
   - ✅ `payment.failed` - When payment fails
5. Click **Create**
6. Copy the **Webhook Secret** (starts with `whsec_`)
7. Add it to your `.env` file as `PAYMONGO_WEBHOOK_SECRET`

### Step 3: Verify Webhook

PayMongo will send a test event. Check your server logs to confirm receipt.

---

## 🧪 Testing

### Test GCash Payment Flow

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Start ngrok (in a separate terminal):**
   ```bash
   ngrok http 3000
   ```

3. **Create a test order:**
   - Add products to cart
   - Proceed to checkout
   - Select **GCash** as payment method
   - Complete the order

4. **Process payment:**
   - You'll be redirected to GCash checkout
   - In **test mode**, use PayMongo's test GCash flow
   - Authorize the payment

5. **Verify webhook:**
   - Check your server logs for webhook events
   - Order should be marked as `PAID`
   - Seller wallet should be credited

### Test Credentials (Test Mode Only)

PayMongo test mode doesn't require actual GCash credentials. The payment flow is simulated.

---

## 🚀 Going Live

### Step 1: Complete PayMongo Verification

1. Submit all required business documents
2. Wait for PayMongo approval (1-3 business days)
3. Get approved for GCash payments

### Step 2: Update Environment Variables

Replace test keys with live keys:

```env
PAYMONGO_SECRET_KEY=sk_live_your_live_secret_key
PAYMONGO_WEBHOOK_SECRET=whsec_your_live_webhook_secret
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### Step 3: Update Webhook URL

1. Go to PayMongo Dashboard → Webhooks
2. Update webhook URL to your production domain:
   ```
   https://yourdomain.com/api/webhooks/paymongo
   ```
3. Ensure your domain has a valid SSL certificate

### Step 4: Test in Production

1. Create a small test order
2. Complete payment with real GCash account
3. Verify order is marked as paid
4. Check seller wallet is credited

---

## 🔍 Troubleshooting

### Issue: Webhook not receiving events

**Solutions:**
- ✅ Verify ngrok is running (for development)
- ✅ Check webhook URL is correct in PayMongo dashboard
- ✅ Ensure your server is accessible from the internet
- ✅ Check server logs for errors
- ✅ Verify `PAYMONGO_WEBHOOK_SECRET` is correct

### Issue: Payment not marked as paid

**Solutions:**
- ✅ Check webhook is properly configured
- ✅ Verify `source.chargeable` and `payment.paid` events are enabled
- ✅ Check server logs for webhook processing errors
- ✅ Ensure database migration was successful

### Issue: Signature verification failed

**Solutions:**
- ✅ Verify `PAYMONGO_WEBHOOK_SECRET` matches PayMongo dashboard
- ✅ Ensure webhook secret starts with `whsec_`
- ✅ Check for extra spaces in `.env` file

### Issue: Order created but no payment link

**Solutions:**
- ✅ Verify `PAYMONGO_SECRET_KEY` is correct
- ✅ Check API key is for the correct mode (test/live)
- ✅ Review server logs for API errors
- ✅ Ensure billing details are complete

---

## 📊 Payment Flow Diagram

```
User Checkout
    ↓
Order Created (isPaid: false, status: ORDER_PLACED)
    ↓
GCash Payment Link Generated
    ↓
User Redirected to GCash
    ↓
User Authorizes Payment
    ↓
PayMongo sends "source.chargeable" webhook
    ↓
Server creates payment
    ↓
PayMongo sends "payment.paid" webhook
    ↓
Server updates order (isPaid: true, status: PAID)
    ↓
Seller wallet credited
    ↓
User redirected to success page
```

---

## 🔐 Security Best Practices

1. **Never expose API keys:**
   - Keep `.env` in `.gitignore`
   - Use environment variables in production
   - Rotate keys if compromised

2. **Always verify webhook signatures:**
   - Our implementation includes signature verification
   - Never skip this step!

3. **Use HTTPS in production:**
   - Required for webhooks
   - Protects sensitive data

4. **Validate payment amounts:**
   - Always verify payment amount matches order total
   - Check currency is PHP

---

## 📞 Support

- **PayMongo Support:** [support@paymongo.com](mailto:support@paymongo.com)
- **PayMongo Documentation:** [https://developers.paymongo.com](https://developers.paymongo.com)
- **PayMongo Dashboard:** [https://dashboard.paymongo.com](https://dashboard.paymongo.com)

---

## ✅ Checklist

Before going live, ensure:

- [ ] PayMongo account verified
- [ ] Business documents submitted and approved
- [ ] Live API keys obtained
- [ ] Webhook configured with production URL
- [ ] SSL certificate installed
- [ ] Test payment completed successfully
- [ ] Environment variables updated for production
- [ ] Webhook signature verification working
- [ ] Order status updates correctly
- [ ] Seller wallet credits correctly

---

**Last Updated:** November 23, 2024
