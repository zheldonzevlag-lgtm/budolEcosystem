# Vercel Postgres Migration Guide

## ✅ Step 1: Environment Variables Setup (Complete This First)

Add these environment variables in Vercel Dashboard:
**Settings → Environment Variables**

### Required Variables:

| Variable | Value | Where to Get It |
|----------|-------|-----------------|
| `DATABASE_URL` | `prisma+postgres://...` | From Vercel Postgres Quickstart (line 3) |
| `DIRECT_URL` | `postgres://...` | From Vercel Postgres Quickstart (line 2) |
| `JWT_SECRET` | `GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc=` | Generated secret |
| `NEXT_PUBLIC_APP_URL` | `https://budolshap.vercel.app` | Your Vercel URL |
| `NEXT_PUBLIC_SITE_URL` | `https://budolshap.vercel.app` | Your Vercel URL |
| `NEXT_PUBLIC_BASE_URL` | `https://budolshap.vercel.app` | Your Vercel URL |
| `NEXT_PUBLIC_CURRENCY_SYMBOL` | `₱` | Philippine Peso symbol |

### Optional Variables (Add if needed):

**For Email Functionality:**
- `SMTP_HOST` - e.g., `smtp.gmail.com`
- `SMTP_PORT` - e.g., `587`
- `SMTP_USER` - Your email
- `SMTP_PASS` - Your email app password
- `SMTP_FROM` - From email address

**For PayMongo/GCash:**
- `PAYMONGO_SECRET_KEY` - Your PayMongo secret key
- `PAYMONGO_WEBHOOK_SECRET` - Your PayMongo webhook secret

**For Admin:**
- `ADMIN_EMAILS` - Comma-separated admin emails

---

## 🚀 Step 2: Run Database Migration

After adding environment variables, you need to apply your Prisma schema to the Vercel Postgres database.

### Option A: Using Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
```bash
npm install -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Link your project**:
```bash
vercel link
```

4. **Pull environment variables** (to get DATABASE_URL locally):
```bash
vercel env pull .env.production
```

5. **Run migration using production database**:
```bash
npx dotenv -e .env.production -- npx prisma migrate deploy
```

### Option B: Using Vercel Dashboard

1. Go to your Vercel project dashboard
2. Navigate to **Settings → General → Build & Development Settings**
3. Add a **Install Command**:
```bash
npm install && npx prisma migrate deploy
```

**Note:** This will run migrations automatically on every deployment.

### Option C: Manual Migration via Vercel Shell

1. Deploy your application first (it will fail without migrations, but that's okay)
2. Go to your Vercel project dashboard
3. Navigate to the latest deployment
4. Click on the **"..."** menu → **"Redeploy"**
5. Before redeploying, ensure migrations run by adding this to your build command in `package.json`:

```json
"build": "prisma generate && prisma migrate deploy && next build"
```

---

## 📝 Step 3: Update Build Script (Recommended)

Update your `package.json` to automatically run migrations during build:

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

This ensures:
1. Prisma Client is generated
2. Database migrations are applied
3. Next.js app is built

---

## 🔍 Step 4: Verify Migration

After deployment, verify the migration was successful:

### Check via Vercel Postgres Dashboard:
1. Go to **Storage → budolshap-db**
2. Click **"Open in Prisma"** or **"Data"** tab
3. You should see all your tables created

### Check via Deployment Logs:
1. Go to your latest deployment
2. Check the build logs
3. Look for Prisma migration output

---

## 🎯 Step 5: Create Admin User (Optional)

After successful migration, create an admin user:

1. **Using Vercel CLI**:
```bash
vercel env pull .env.production
npx dotenv -e .env.production -- node scripts/create-admin.js
```

2. **Or add admin via your app** after deployment using the registration flow

---

## 🔄 Step 6: Deploy

1. **Commit and push your changes**:
```bash
git add .
git commit -m "Configure for Vercel Postgres"
git push
```

2. **Vercel will automatically deploy** (if connected to Git)

3. **Or manually deploy**:
```bash
vercel --prod
```

---

## ⚠️ Troubleshooting

### Migration Fails
- Check that `DATABASE_URL` and `DIRECT_URL` are correctly set
- Ensure you're using `DIRECT_URL` for migrations (non-pooled connection)
- Check deployment logs for specific error messages

### Build Fails
- Verify all environment variables are set
- Check that Prisma schema is valid
- Ensure `prisma` is in dependencies (not devDependencies)

### Database Connection Issues
- Verify the connection strings from Vercel Postgres
- Check that the database is in the same region as your deployment
- Ensure you're using the correct URL for pooled vs direct connections

---

## 📚 Additional Resources

- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)
- [Prisma with Vercel Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## ✨ Quick Command Reference

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project
vercel link

# Pull environment variables
vercel env pull .env.production

# Run migrations
npx dotenv -e .env.production -- npx prisma migrate deploy

# Deploy to production
vercel --prod

# View logs
vercel logs
```
