# Required Environment Variables for Vercel Deployment

## ✅ Already Set (from Database Connection)
- DATABASE_URL
- DIRECT_URL
- POSTGRES_URL
- PRISMA_DATABASE_URL

## ❌ MISSING - Need to Add to Vercel

### 1. JWT & Authentication
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

### 2. Cloudinary (Image Uploads)
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 3. Email (SMTP)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@budolshap.com
```

### 4. PayMongo (Payment Gateway)
```
PAYMONGO_SECRET_KEY=sk_test_... or sk_live_...
PAYMONGO_PUBLIC_KEY=pk_test_... or pk_live_...
NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_test_... or pk_live_...
```

### 5. Lalamove (Delivery)
```
LALAMOVE_CLIENT_ID=your-client-id
LALAMOVE_CLIENT_SECRET=your-client-secret
LALAMOVE_ENV=sandbox or production
LALAMOVE_WEBHOOK_SECRET=your-webhook-secret
ENABLE_LALAMOVE=true
```

### 6. Application URLs
```
NEXT_PUBLIC_BASE_URL=https://budolshap-prusqsxam-jons-projects-9722fe4a.vercel.app
NEXT_PUBLIC_APP_URL=https://budolshap-prusqsxam-jons-projects-9722fe4a.vercel.app
NEXT_PUBLIC_SITE_URL=https://budolshap-prusqsxam-jons-projects-9722fe4a.vercel.app
NEXT_PUBLIC_CURRENCY_SYMBOL=₱
```

### 7. Admin Configuration
```
ADMIN_EMAILS=admin@budolshap.com
```

### 8. Cron Job (Optional)
```
CRON_SECRET=your-cron-secret
```

---

## 🚀 How to Add These to Vercel

### Method 1: Via Vercel Dashboard (Recommended)

1. Go to: https://vercel.com/jons-projects-9722fe4a/budolshap/settings/environment-variables

2. For each variable above:
   - Click "Add New"
   - Enter the Key (e.g., `JWT_SECRET`)
   - Enter the Value
   - Select: ✅ Production, ✅ Preview, ✅ Development
   - Click "Save"

3. After adding all variables, redeploy:
   ```bash
   vercel --prod
   ```

### Method 2: Copy from Local .env.production

You can copy the values from your local `.env.production` file.

**Important:** Make sure to use the SAME values you have locally for:
- JWT_SECRET (must match for auth to work)
- Cloudinary credentials
- PayMongo keys
- Lalamove credentials
- SMTP settings

---

## ⚠️ Critical Variables for Store Creation

The store creation is failing because these are missing:

1. **JWT_SECRET** - Required for authentication
2. **CLOUDINARY_*** - Required for logo upload (optional but recommended)
3. **NEXT_PUBLIC_BASE_URL** - Required for proper routing

**Minimum to get store creation working:**
- JWT_SECRET
- NEXT_PUBLIC_BASE_URL
- ADMIN_EMAILS

---

## 🔍 How to Check Current Vercel Variables

Run this command to see what's currently set:
```bash
vercel env ls
```

---

## 📝 After Adding Variables

1. Redeploy:
   ```bash
   vercel --prod
   ```

2. Test store creation again

3. Check admin panel for pending stores

---

**Note:** Your local `.env.production` file has all these values. You just need to copy them to Vercel's environment variables settings.
