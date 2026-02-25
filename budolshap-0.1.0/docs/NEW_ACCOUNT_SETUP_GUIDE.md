# Setup Guide for New Vercel Account Deployment

## Current Status
✅ Logged in to new Vercel account (Jon's projects)
✅ Project unlinked from old account
⏳ Deployment in progress (or completed)
❌ Database not configured yet

## Next Steps

### 1. Create New Database in Vercel

1. Go to: https://vercel.com (make sure you're logged in as Jon)
2. Select your project (budolshap or whatever name you chose)
3. Click **Storage** tab
4. Click **Create Database**
5. Select **Postgres** (or Prisma Postgres)
6. Name it: `budolshap-db`
7. Click **Create**

### 2. Get Database Connection Strings

After creating the database, Vercel will show you:
- `POSTGRES_PRISMA_URL` (for DATABASE_URL)
- `POSTGRES_URL_NON_POOLING` (for DIRECT_URL)
- `POSTGRES_URL`

**Copy these values!**

### 3. Update Local .env.production

Open: `c:\wamp64\www\budolshap - Copy (24)\.env.production`

Find and replace these lines:
```
DATABASE_URL="..."
DIRECT_URL="..."
```

With the NEW values from step 2:
```
DATABASE_URL="[paste POSTGRES_PRISMA_URL here]"
DIRECT_URL="[paste POSTGRES_URL_NON_POOLING here]"
```

### 4. Copy .env.production to .env

```bash
Copy-Item .env.production .env
```

### 5. Run Database Migrations

```bash
npx prisma db push
```

This creates all the tables in your new database.

### 6. Create Admin Account

```bash
node scripts/create-custom-admin.js
```

This will create:
- Email: admin@budolshap.com
- Password: tr@1t0r

### 7. Update Vercel Environment Variables

Go to your Vercel project settings:
https://vercel.com/[your-username]/budolshap/settings/environment-variables

Add ALL environment variables from your `.env.production` file:
- DATABASE_URL
- DIRECT_URL
- JWT_SECRET
- CLOUDINARY_*
- PAYMONGO_*
- LALAMOVE_*
- EMAIL_*
- etc.

**Important:** The database variables should already be there if you clicked "Connect Database" in Vercel UI.

### 8. Redeploy

```bash
vercel --prod
```

### 9. Test

Go to: https://[your-deployment-url]/admin/login

Login with:
- Email: admin@budolshap.com
- Password: tr@1t0r

---

## Quick Commands Summary

```bash
# 1. Copy env file
Copy-Item .env.production .env

# 2. Push schema to database
npx prisma db push

# 3. Create admin
node scripts/create-custom-admin.js

# 4. Deploy
vercel --prod
```

---

## Troubleshooting

### "Can't reach database"
- Make sure you updated DATABASE_URL in .env.production
- Make sure you copied .env.production to .env
- Check that the database exists in Vercel dashboard

### "Build failed" on deployment
- Check that all environment variables are set in Vercel
- Especially DATABASE_URL and DIRECT_URL

### "Admin already exists"
- The admin was created successfully before
- Just try logging in with the credentials

---

**Current Admin Credentials:**
- Email: admin@budolshap.com  
- Password: tr@1t0r
