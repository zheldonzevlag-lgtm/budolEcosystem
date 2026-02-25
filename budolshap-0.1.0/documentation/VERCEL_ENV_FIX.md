# Environment Variables Checklist for Vercel

## ⚠️ CRITICAL: Missing JWT_SECRET

Your authentication is failing because `JWT_SECRET` is not set in Vercel environment variables.

### Required Environment Variables:

```bash
# Authentication (CRITICAL - MISSING)
JWT_SECRET=your-production-secret-key-min-32-chars

# Database (Should already be set)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Lalamove API
LALAMOVE_CLIENT_ID=your_client_id
LALAMOVE_CLIENT_SECRET=your_client_secret
LALAMOVE_ENV=sandbox  # or production
LALAMOVE_WEBHOOK_SECRET=your_webhook_secret

# Email (Optional but recommended for Phase 2)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@budolshap.com

# App URL
NEXT_PUBLIC_APP_URL=https://budolshap-v3-j81ea1fen-jon-galvezs-projects-f5372ed2.vercel.app
```

## 🔧 How to Fix:

### Option 1: Via Vercel Dashboard
1. Go to: https://vercel.com/jons-projects-9722fe4a/budolshap-v3/settings/environment-variables
2. Add `JWT_SECRET` with a strong random value (min 32 characters)
3. Redeploy the application

### Option 2: Generate Strong Secret
```bash
# Generate a secure random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Option 3: Use this temporary value (CHANGE IN PRODUCTION!)
```
JWT_SECRET=budolshap-production-jwt-secret-2025-change-this-to-random-value
```

## 🚨 Why This Causes Login Redirect:

1. User logs in → JWT token created with `JWT_SECRET`
2. Token stored in localStorage
3. User navigates to protected page
4. Server tries to verify token with `JWT_SECRET`
5. **If `JWT_SECRET` is missing or different**, verification fails
6. User redirected to login

## ✅ After Adding JWT_SECRET:

1. Redeploy the app (or it will auto-redeploy)
2. Clear browser localStorage (F12 → Application → Local Storage → Clear)
3. Login again
4. Navigation should work properly

## 📝 Verify Environment Variables:

You can check which env vars are set in Vercel:
https://vercel.com/jons-projects-9722fe4a/budolshap-v3/settings/environment-variables
