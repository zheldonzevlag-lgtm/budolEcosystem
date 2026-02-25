# Vercel Environment Variables Setup for budolshap-v2

## ✅ Deployment Status
- **Production URL**: https://budolshap-v2-9p9l38fz7-derflanoj2s-projects.vercel.app
- **Deployment ID**: 56y5c9ZRCEYrVvzKJAEuqFre8vpB

## 📋 Required Environment Variables

Add these variables in Vercel Dashboard → Settings → Environment Variables

### 1. Database Configuration

**DATABASE_PROVIDER**
- **Value**: `postgresql`
- **Environment**: Production, Preview, Development
- **Note**: Tells the app to use PostgreSQL in production

The following are automatically provided by Vercel Postgres (already set):
- ✅ `POSTGRES_URL`
- ✅ `POSTGRES_PRISMA_URL` (mapped to DATABASE_URL)
- ✅ `POSTGRES_URL_NON_POOLING` (mapped to DIRECT_URL)

### 2. Application Settings

**JWT_SECRET**
- **Value**: Generate a strong random string (e.g., use: `openssl rand -base64 32`)
- **Environment**: Production, Preview, Development
- **Example**: `your-super-secret-jwt-key-change-this-in-production`
- **⚠️ IMPORTANT**: Use a different secret than your local development!

**NEXT_PUBLIC_CURRENCY_SYMBOL**
- **Value**: `₱`
- **Environment**: Production, Preview, Development

**NEXT_PUBLIC_BASE_URL**
- **Value**: `https://budolshap-v2-9p9l38fz7-derflanoj2s-projects.vercel.app`
- **Environment**: Production
- **Note**: Update this if you add a custom domain later

### 3. Cloudinary Configuration

**NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME**
- **Value**: Your Cloudinary cloud name
- **Environment**: Production, Preview, Development

**CLOUDINARY_API_KEY**
- **Value**: Your Cloudinary API key
- **Environment**: Production, Preview, Development

**CLOUDINARY_API_SECRET**
- **Value**: Your Cloudinary API secret
- **Environment**: Production, Preview, Development

### 4. Email Configuration (NodeMailer)

**EMAIL_HOST**
- **Value**: `smtp.gmail.com`
- **Environment**: Production, Preview, Development

**EMAIL_PORT**
- **Value**: `587`
- **Environment**: Production, Preview, Development

**EMAIL_USER**
- **Value**: Your Gmail address (e.g., `your-email@gmail.com`)
- **Environment**: Production, Preview, Development

**EMAIL_PASSWORD**
- **Value**: Your Gmail App Password (not your regular password!)
- **Environment**: Production, Preview, Development
- **How to get**: https://support.google.com/accounts/answer/185833

**EMAIL_FROM**
- **Value**: `noreply@budolshap.com` (or your preferred sender address)
- **Environment**: Production, Preview, Development

### 5. PayMongo Configuration

**⚠️ IMPORTANT**: Use LIVE keys for production, not test keys!

**PAYMONGO_SECRET_KEY**
- **Value**: `sk_live_...` (your PayMongo LIVE secret key)
- **Environment**: Production
- **Note**: Use `sk_test_...` for Preview/Development

**PAYMONGO_PUBLIC_KEY**
- **Value**: `pk_live_...` (your PayMongo LIVE public key)
- **Environment**: Production
- **Note**: Use `pk_test_...` for Preview/Development

**NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY**
- **Value**: `pk_live_...` (same as PAYMONGO_PUBLIC_KEY)
- **Environment**: Production
- **Note**: Use `pk_test_...` for Preview/Development

### 6. Lalamove Configuration

**⚠️ IMPORTANT**: Use production credentials for production!

**LALAMOVE_API_KEY**
- **Value**: Your Lalamove production API key
- **Environment**: Production
- **Note**: Use sandbox key for Preview/Development

**LALAMOVE_API_SECRET**
- **Value**: Your Lalamove production API secret
- **Environment**: Production
- **Note**: Use sandbox secret for Preview/Development

**LALAMOVE_ENVIRONMENT**
- **Value**: `production`
- **Environment**: Production
- **Note**: Use `sandbox` for Preview/Development

## 🚀 Quick Setup Steps

1. Go to: https://vercel.com/derflanoj2s-projects/budolshap-v2/settings/environment-variables

2. For each variable above:
   - Click "Add New" or "Add Environment Variable"
   - Enter the **Key** (variable name)
   - Enter the **Value**
   - Select environments: Production, Preview, Development (as noted)
   - Click "Save"

3. After adding all variables, redeploy your application:
   ```bash
   vercel --prod
   ```

## ⚠️ Security Notes

1. **Never commit** `.env` files to git
2. **Use different secrets** for production vs development
3. **Use LIVE payment keys** in production (PayMongo)
4. **Use production Lalamove** credentials in production
5. **Rotate secrets** periodically for security

## 📝 Post-Setup Checklist

After adding all environment variables:

- [ ] Run database migrations: `npx prisma migrate deploy`
- [ ] Create admin account using the admin creation script
- [ ] Test user registration/login
- [ ] Test payment flow (with real PayMongo account)
- [ ] Test Lalamove delivery booking
- [ ] Test email sending (verification, password reset)
- [ ] Test image uploads (Cloudinary)

## 🔧 Troubleshooting

If you encounter issues after deployment:

1. **Check Vercel Logs**: Go to Deployments → Click on deployment → View Function Logs
2. **Verify all variables are set**: Check Settings → Environment Variables
3. **Redeploy**: Sometimes variables need a fresh deployment to take effect
4. **Check database**: Ensure Vercel Postgres is connected and migrations are applied

## 📚 Additional Resources

- [Vercel Environment Variables Docs](https://vercel.com/docs/projects/environment-variables)
- [Vercel Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)
- [PayMongo API Docs](https://developers.paymongo.com/)
- [Lalamove API Docs](https://developers.lalamove.com/)
