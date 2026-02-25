# E-Commerce Payment Error Handling Best Practices

## 🎯 Overview

This document outlines the industry-standard best practices for handling payment failures and errors in e-commerce applications, specifically implemented for the Budolshap application's PayMongo GCash integration.

## 📋 Table of Contents

1. [The Problem](#the-problem)
2. [Industry Best Practices](#industry-best-practices)
3. [Implementation Details](#implementation-details)
4. [Payment Flow States](#payment-flow-states)
5. [Error Recovery Mechanisms](#error-recovery-mechanisms)
6. [Testing Scenarios](#testing-scenarios)

---

## 🔴 The Problem

### What Happened?
After authorizing a GCash payment through PayMongo's test environment, users were redirected to a **404 error page** instead of a proper payment status page.

### Root Causes:
1. **Missing/Incorrect Environment Variable**: `NEXT_PUBLIC_SITE_URL` not set correctly in production
2. **No Fallback Handling**: Application didn't gracefully handle redirect failures
3. **Incomplete Error States**: Limited error handling for edge cases
4. **No Retry Mechanism**: Users couldn't easily retry failed payments

---

## ✅ Industry Best Practices

### 1. **Never Show Raw Errors to Users**
❌ **Bad**: "404 Not Found" or "Error 500"  
✅ **Good**: "We're having trouble verifying your payment. Please check your orders page."

### 2. **Provide Clear Next Steps**
Every error state should answer:
- **What happened?** (Clear status message)
- **Why did it happen?** (Possible reasons)
- **What can I do?** (Action buttons)

### 3. **Implement Payment Recovery**
- Allow easy retry without re-entering information
- Preserve order context
- Provide alternative payment methods
- Keep orders in "pending" state for recovery

### 4. **Graceful Degradation**
- Handle missing parameters
- Implement timeout mechanisms
- Provide fallback URLs
- Log errors for debugging

### 5. **User Communication**
- Real-time status updates
- Email notifications
- Order tracking
- Support contact information

### 6. **Technical Robustness**
- Idempotency for payment retries
- Proper error logging
- Webhook verification (when applicable)
- Database transaction integrity

---

## 🛠️ Implementation Details

### Payment Return Page States

Our enhanced `/payment/return` page now handles **5 distinct states**:

#### 1. **Checking** (Initial State)
```javascript
status: 'checking'
```
- Shows loading spinner
- Polls PayMongo API every 2 seconds
- Displays progress indicator after 10 polls
- Maximum 30 polls (60 seconds)

**User sees:**
- Animated spinner
- "Verifying Payment" message
- Progress timer (after 10 polls)

#### 2. **Succeeded** (Payment Complete)
```javascript
status: 'succeeded'
```
- Payment confirmed by PayMongo
- Order updated in database
- User sees success confirmation

**User sees:**
- Green checkmark animation
- Order details (ID, amount, status)
- "View My Orders" button
- "Continue Shopping" button
- Email confirmation notice

#### 3. **Failed** (Payment Declined)
```javascript
status: 'failed'
```
- Payment was declined or cancelled
- Order remains in pending state
- Retry option available

**User sees:**
- Red X icon
- Clear failure message
- Common failure reasons (insufficient balance, cancelled, timeout)
- "Try Again" button (redirects to checkout with order ID)
- "View Orders" button
- "Return to Home" button

#### 4. **Timeout** (Verification Timeout)
```javascript
status: 'timeout'
```
- Verification exceeded 60 seconds
- Payment may still be processing
- User directed to check later

**User sees:**
- Clock icon
- Timeout explanation
- What to do next (check orders, email, contact support)
- "Check My Orders" button
- "Retry Verification" button
- "Return to Home" button

#### 5. **Error** (Technical Error)
```javascript
status: 'error'
```
- Missing payment intent ID
- API errors
- Network failures

**User sees:**
- Alert icon
- Error explanation
- Reassurance about payment safety
- "View My Orders" button
- "Retry Payment" button (if order ID available)
- "Return to Home" button
- Support contact information

---

## 🔄 Error Recovery Mechanisms

### 1. **Automatic Retry Logic**
```javascript
// Retry API calls up to 3 times before giving up
if (count < 3) {
    setTimeout(() => pollStatus(id, oid, count + 1), 3000);
} else {
    setStatus('error');
}
```

### 2. **Order Context Preservation**
```javascript
// Extract orderId from URL parameters
const oid = searchParams.get('orderId');

// Fetch order details for display
const fetchOrderDetails = async (id) => {
    const response = await fetch(`/api/orders/${id}`);
    const data = await response.json();
    setOrder(data);
};
```

### 3. **Payment Retry Flow**
```javascript
const handleRetryPayment = async () => {
    // Redirect to checkout with existing order ID
    router.push(`/checkout?orderId=${orderId}&retry=true`);
};
```

### 4. **Timeout Protection**
```javascript
const MAX_POLLS = 30; // 60 seconds maximum

if (count >= MAX_POLLS) {
    setStatus('timeout');
    // Guide user to alternative verification methods
}
```

---

## 🧪 Testing Scenarios

### Test Case 1: Successful Payment
**Steps:**
1. Complete checkout with GCash
2. Authorize payment in PayMongo test page
3. Verify redirect to success page
4. Check order status in database

**Expected Result:**
- ✅ Success page displays
- ✅ Order marked as paid
- ✅ Order details shown correctly

### Test Case 2: Failed Payment
**Steps:**
1. Complete checkout with GCash
2. Click "Fail/Expire Test Payment" in PayMongo
3. Verify redirect to failed page

**Expected Result:**
- ✅ Failed page displays
- ✅ Retry button available
- ✅ Order remains in pending state
- ✅ Common reasons displayed

### Test Case 3: Missing Payment Intent
**Steps:**
1. Navigate directly to `/payment/return` without parameters
2. Verify error handling

**Expected Result:**
- ✅ Error page displays
- ✅ Helpful message shown
- ✅ Navigation options available
- ✅ No crash or 404

### Test Case 4: Network Timeout
**Steps:**
1. Simulate slow network
2. Complete payment
3. Wait for timeout

**Expected Result:**
- ✅ Timeout page displays after 60 seconds
- ✅ Instructions to check orders page
- ✅ Retry verification option

### Test Case 5: API Error
**Steps:**
1. Temporarily break PayMongo API key
2. Complete payment
3. Verify error handling

**Expected Result:**
- ✅ Error page displays
- ✅ Retry mechanism available
- ✅ Error logged to console
- ✅ User not left stranded

---

## 📊 Payment Flow Diagram

```
User Checkout
     ↓
Create Payment Intent
     ↓
Redirect to PayMongo
     ↓
User Authorizes Payment
     ↓
Redirect to /payment/return?payment_intent_id=xxx&orderId=xxx
     ↓
┌─────────────────────────────────────────┐
│         Poll Payment Status             │
│  (Every 2 seconds, max 60 seconds)      │
└─────────────────────────────────────────┘
     ↓
┌────────────┬──────────┬─────────┬─────────┐
│            │          │         │         │
SUCCEEDED   FAILED   TIMEOUT   ERROR   PENDING
│            │          │         │         │
✅ Success   ❌ Failed  ⏰ Wait   ⚠️ Error  🔄 Retry
│            │          │         │         │
Update DB   Keep       Guide     Show      Continue
            Pending    User      Help      Polling
            + Retry    + Retry   + Retry
```

---

## 🔐 Security Considerations

### 1. **Server-Side Verification**
Always verify payment status with PayMongo API on the server:
```javascript
// In /api/orders/update-status
const intentResp = await fetch(
    `https://api.paymongo.com/v1/payment_intents/${intentId}`,
    { headers: { authorization: authHeader } }
);
```

### 2. **Idempotency**
Prevent duplicate order updates:
```javascript
// Check if order is already paid
if (order.isPaid) {
    return NextResponse.json({ error: 'Order already paid' });
}
```

### 3. **Input Validation**
Validate all parameters:
```javascript
if (!intentId || !status) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
}
```

---

## 🌐 Environment Variables

### Required Variables
```env
# PayMongo API Keys
PAYMONGO_SECRET_KEY=sk_test_xxxxxxxxxxxxx
PAYMONGO_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx

# Application URLs
NEXT_PUBLIC_SITE_URL=https://budolshap.vercel.app
NEXT_PUBLIC_BASE_URL=https://budolshap.vercel.app

# Database
DATABASE_URL=prisma+postgres://...
DIRECT_URL=postgres://...
```

### Vercel Configuration
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all required variables
3. Ensure `NEXT_PUBLIC_SITE_URL` matches your production domain
4. Redeploy after adding variables

---

## 📝 Additional Pages Created

### 1. `/payment/pending`
For payments that are still being processed:
- Shows pending status
- Provides order details
- Offers retry option
- Explains what's happening

### 2. Enhanced `/payment/return`
Comprehensive payment verification page with:
- 5 distinct states (checking, succeeded, failed, timeout, error)
- Automatic retry logic
- Order context preservation
- Clear user guidance

### 3. Existing Pages Maintained
- `/payment/success` - For GCash Source API flow
- `/payment/failed` - For GCash Source API flow
- `/payment/cancel` - For cancelled payments

---

## 🎓 Key Learnings

### What Big E-Commerce Sites Do:

#### Amazon
- Never shows technical errors
- Always provides order tracking
- Multiple retry options
- 24/7 support links

#### Shopify
- Clear payment status pages
- Email confirmations
- Order recovery flows
- Detailed error messages

#### Stripe (Payment Provider)
- Comprehensive error codes
- Automatic retry logic
- Webhook verification
- Idempotent requests

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Set `NEXT_PUBLIC_SITE_URL` in Vercel
- [ ] Set `NEXT_PUBLIC_BASE_URL` in Vercel
- [ ] Verify PayMongo API keys (use production keys)
- [ ] Test all payment flows in staging
- [ ] Verify email notifications work
- [ ] Test error scenarios
- [ ] Check database migrations
- [ ] Enable error logging/monitoring
- [ ] Set up webhook endpoints (if using)
- [ ] Test mobile responsiveness
- [ ] Verify SSL certificates
- [ ] Test timeout scenarios

---

## 📞 Support & Troubleshooting

### Common Issues

#### Issue: 404 Error After Payment
**Solution:**
1. Check `NEXT_PUBLIC_SITE_URL` is set correctly
2. Verify the URL matches your production domain
3. Ensure no trailing slashes
4. Redeploy after changing environment variables

#### Issue: Payment Status Not Updating
**Solution:**
1. Check PayMongo API key is valid
2. Verify `/api/orders/update-status` endpoint works
3. Check database connection
4. Review server logs

#### Issue: Infinite Loading
**Solution:**
1. Check network tab for API errors
2. Verify PayMongo API is accessible
3. Check for CORS issues
4. Review timeout settings

---

## 📚 References

- [PayMongo Documentation](https://developers.paymongo.com/)
- [Stripe Error Handling Best Practices](https://stripe.com/docs/error-handling)
- [Next.js Error Handling](https://nextjs.org/docs/advanced-features/error-handling)
- [E-Commerce UX Best Practices](https://baymard.com/blog/checkout-flow-average-form-fields)

---

## 📄 License

This implementation follows industry-standard practices and is part of the Budolshap e-commerce platform.

---

**Last Updated:** November 24, 2025  
**Version:** 2.0  
**Author:** Budolshap Development Team
