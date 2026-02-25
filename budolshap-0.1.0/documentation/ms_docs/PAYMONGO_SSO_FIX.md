# PayMongo GCash Return URL - SSO Fix

## Problem
After authorizing GCash payment, users were redirected to Vercel's login page instead of the payment confirmation page.

## Root Cause
The `NEXT_PUBLIC_SITE_URL` environment variable in Vercel was likely set to a **protected Vercel preview URL** (e.g., `budolshap-xxx-projects.vercel.app`). These URLs are behind Vercel's SSO authentication, which caused the redirect to hit a login wall.

## Solution Applied
**Hardcoded the production domain** in the PayMongo return URL to `https://budolshap.vercel.app`, bypassing any environment variables that might point to protected URLs.

### Changes Made
**File:** `app/api/paymongo/create-intent/route.js`

```javascript
// Before (relied on environment variable)
const productionDomain = process.env.NEXT_PUBLIC_SITE_URL || 'https://budolshap.vercel.app';

// After (hardcoded)
returnUrl = 'https://budolshap.vercel.app/payment/return';
```

## Testing Instructions

### 1. Clear Browser Cache
- Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
- Select "Cached images and files"
- Click "Clear data"

### 2. Test Payment Flow
1. Go to **https://budolshap.vercel.app**
2. Create a new order with GCash payment
3. Click "Authorize Test Payment" on the PayMongo test page
4. **Expected Result:** You should be redirected to `https://budolshap.vercel.app/payment/return` with a success message
5. **NOT:** Vercel login page

### 3. Verify Return URL in Logs
After creating a payment, check the Vercel function logs:
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the latest deployment
3. Go to "Functions" tab
4. Find `/api/paymongo/create-intent`
5. Look for the log: `🔗 PayMongo Return URL: https://budolshap.vercel.app/payment/return`

## Additional Fix: Check Vercel Environment Variables

You should also verify/update your Vercel environment variables to prevent future issues:

### Option 1: Via Vercel Dashboard (Recommended)
1. Go to **https://vercel.com/dashboard**
2. Select your **budolshap** project
3. Go to **Settings** → **Environment Variables**
4. Find `NEXT_PUBLIC_SITE_URL`
5. **Set it to:** `https://budolshap.vercel.app`
6. **Apply to:** Production, Preview, Development
7. Click **Save**
8. **Redeploy** your application

### Option 2: Via Vercel CLI
```bash
# Remove the old value (if it exists)
vercel env rm NEXT_PUBLIC_SITE_URL production

# Add the correct value
vercel env add NEXT_PUBLIC_SITE_URL production
# When prompted, enter: https://budolshap.vercel.app

# Redeploy
vercel --prod
```

## Why This Happened

Vercel generates multiple URLs for each deployment:
- **Production URL:** `budolshap.vercel.app` (public, no login required)
- **Preview URLs:** `budolshap-git-main-xxx.vercel.app` (protected by SSO)
- **Deployment URLs:** `budolshap-xxx-projects.vercel.app` (protected by SSO)

If `NEXT_PUBLIC_SITE_URL` was set to a preview/deployment URL, PayMongo would redirect users to a protected URL, triggering the login page.

## Current Status
✅ **Fixed** - Return URL is now hardcoded to the public production domain
✅ **Deployed** - Changes are live on production
⚠️ **Action Required** - Update Vercel environment variables (optional but recommended)

## Troubleshooting

### If you still see the Vercel login page:
1. **Clear browser cache completely**
2. **Try incognito/private browsing mode**
3. **Check the URL in the browser** - it should be `budolshap.vercel.app`, not `budolshap-xxx-projects.vercel.app`
4. **Verify the deployment** - make sure you're using the latest deployment

### If payment verification fails:
1. Check Vercel function logs for errors
2. Verify `PAYMONGO_SECRET_KEY` is set correctly
3. Check if the payment intent was created successfully in PayMongo dashboard

---

**Last Updated:** 2025-11-26  
**Deployment:** https://budolshap.vercel.app  
**Status:** ✅ Live
