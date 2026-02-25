# Fix PayMongo GCash Return URL Issue

## Problem
After authorizing payment in GCash, users are redirected to a Vercel login page instead of the payment return page.

## Root Cause
The PayMongo return URL was being intercepted by Vercel's authentication/SSO system, likely due to:
1. Middleware blocking the `/payment/return` route
2. Missing Vercel routing configuration
3. Potential URL parameter conflicts

## Changes Made

### 1. Updated PayMongo Return URL Construction
**File:** `app/api/paymongo/create-intent/route.js`

- Added more robust URL cleaning and validation
- Ensured proper HTTPS protocol
- Removed trailing slashes
- Added better logging for debugging

### 2. Excluded Payment Routes from Middleware
**File:** `middleware.js`

- Added explicit exclusion for `/payment` routes
- Ensures payment return pages are accessible without authentication
- Prevents middleware from blocking PayMongo redirects

### 3. Created Vercel Configuration
**File:** `vercel.json`

- Added explicit routing rules for payment pages
- Prevents Vercel from misinterpreting payment return URLs

## Deployment Instructions

### Option 1: Quick Deploy (Recommended)
```bash
# From project root
vercel --prod
```

### Option 2: Full Deployment with Checks
```bash
# 1. Ensure you're logged in
vercel login

# 2. Link project (if not already linked)
vercel link

# 3. Deploy to production
vercel --prod
```

## Testing After Deployment

1. **Create a test order** with GCash payment
2. **Authorize payment** in GCash
3. **Verify redirect** - You should now land on `/payment/return` instead of Vercel login
4. **Check payment status** - The page should verify your payment and show success

## Environment Variables to Verify

Make sure these are set in your Vercel project:

```bash
NEXT_PUBLIC_SITE_URL=https://budolshap.vercel.app
# OR
NEXT_PUBLIC_APP_URL=https://budolshap.vercel.app

# Also ensure:
PAYMONGO_SECRET_KEY=sk_test_... (or sk_live_...)
DATABASE_URL=postgres://...
DIRECT_URL=postgres://...
JWT_SECRET=your-secret-key
```

## Troubleshooting

If the issue persists after deployment:

1. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Your Project → Deployments → Latest → Functions
   - Look for errors in `/api/paymongo/create-intent`

2. **Verify Return URL:**
   - Check the console logs when creating payment
   - The return URL should be: `https://budolshap.vercel.app/payment/return`

3. **Test Locally First:**
   ```bash
   npm run dev
   ```
   - Use PayMongo test mode
   - Verify the flow works locally

4. **Check PayMongo Dashboard:**
   - Log in to PayMongo
   - Check if the payment intent was created
   - Verify the return_url in the payment intent details

## Alternative Workaround (If Still Failing)

If the issue persists, you can manually navigate to your orders:

1. After payment authorization in GCash
2. Wait for the payment to process (usually 1-2 minutes)
3. Manually go to: `https://budolshap.vercel.app/orders`
4. Your order should show as "Paid"

The webhook will still update the order status in the background.

---

**Created:** 2025-11-25
**Status:** Ready to deploy
