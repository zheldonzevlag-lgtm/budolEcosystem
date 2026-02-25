---
description: Deploy application to Vercel with Postgres
---

# Deploy to Vercel - Complete Guide

## Prerequisites
- Vercel account (free tier available)
- GitHub account
- Git repository pushed to GitHub

## Step 1: Push Your Code to GitHub

If you haven't already pushed your latest changes:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

## Step 2: Install Vercel CLI (Optional but Recommended)

```bash
npm install -g vercel
```

## Step 3: Deploy to Vercel

### Option A: Using Vercel CLI (Recommended)

// turbo
1. Login to Vercel:
```bash
vercel login
```

2. Deploy the project:
```bash
vercel
```

3. Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N** (first time)
   - What's your project's name? **budolshap** (or your preferred name)
   - In which directory is your code located? **./**
   - Want to override the settings? **N**

4. Deploy to production:
```bash
vercel --prod
```

### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your Git repository
4. Configure project:
   - Framework Preset: **Next.js**
   - Root Directory: **./**
   - Build Command: `prisma generate && next build`
   - Output Directory: `.next`
   - Install Command: `npm install`

## Step 4: Set Up Vercel Postgres Database

1. In your Vercel project dashboard, go to **Storage** tab
2. Click **Create Database**
3. Select **Postgres**
4. Choose a database name (e.g., `budolshap-db`)
5. Select region (choose closest to your users)
6. Click **Create**

7. After creation, go to the **.env.local** tab
8. Copy the environment variables:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NO_SSL`
   - `POSTGRES_URL_NON_POOLING`

## Step 5: Configure Environment Variables

In your Vercel project settings:

1. Go to **Settings** → **Environment Variables**
2. Add the following variables:

### Database Variables:

**CRITICAL**: Add this first:
- `DATABASE_PROVIDER` = `postgresql`

The following are automatically provided by Vercel Postgres:
- `POSTGRES_PRISMA_URL` (automatically mapped to DATABASE_URL)
- `POSTGRES_URL_NON_POOLING` (automatically mapped to DIRECT_URL)
- `POSTGRES_URL`

### Application Variables (from your .env file):
- `JWT_SECRET` = Your secret key (generate a new strong one for production!)
- `NEXT_PUBLIC_CURRENCY_SYMBOL` = `₱`
- `NEXT_PUBLIC_BASE_URL` = Your Vercel deployment URL (e.g., https://budolshap.vercel.app)

### Cloudinary Variables:
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` = Your Cloudinary cloud name
- `CLOUDINARY_API_KEY` = Your Cloudinary API key
- `CLOUDINARY_API_SECRET` = Your Cloudinary API secret

### Email Variables:
- `EMAIL_HOST` = `smtp.gmail.com`
- `EMAIL_PORT` = `587`
- `EMAIL_USER` = Your email for nodemailer
- `EMAIL_PASSWORD` = Your email app password
- `EMAIL_FROM` = Your from email address

### PayMongo Variables (Use LIVE keys for production!):
- `PAYMONGO_SECRET_KEY` = Your PayMongo secret key (sk_live_...)
- `PAYMONGO_PUBLIC_KEY` = Your PayMongo public key (pk_live_...)
- `NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY` = Your PayMongo public key (pk_live_...)

### Lalamove Variables (Use production credentials!):
- `LALAMOVE_API_KEY` = Your Lalamove API key
- `LALAMOVE_API_SECRET` = Your Lalamove API secret
- `LALAMOVE_ENVIRONMENT` = `production`

**Important**: 
- Set these for **Production**, **Preview**, and **Development** environments.
- For detailed setup instructions, see `VERCEL_ENV_SETUP.md`


## Step 6: Run Database Migrations

After setting up the database and environment variables:

1. Install Vercel CLI if you haven't:
```bash
npm install -g vercel
```

2. Pull environment variables locally:
```bash
vercel env pull .env.local
```

3. Run Prisma migrations:
```bash
npx prisma migrate deploy
```

Or you can run migrations directly on Vercel by adding a `postbuild` script in package.json:
```json
"postbuild": "prisma migrate deploy"
```

## Step 7: Verify Deployment

1. Visit your deployment URL (e.g., https://budolshap.vercel.app)
2. Test key functionality:
   - User registration/login
   - Product browsing
   - Cart functionality
   - Checkout process
   - Admin panel access

## Step 8: Set Up Custom Domain (Optional)

1. In Vercel dashboard, go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` to your custom domain

## Troubleshooting

### Build Errors
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify `prisma generate` runs before build

### Database Connection Issues
- Verify `DATABASE_URL` and `DIRECT_URL` are set correctly
- Check that Prisma schema uses `postgresql` provider
- Ensure migrations are applied

### Environment Variable Issues
- Double-check all required variables are set
- Verify variables are set for correct environment (Production/Preview/Development)
- Redeploy after adding/updating variables

### PayMongo/Payment Issues
- Verify PayMongo keys are correct
- Ensure `NEXT_PUBLIC_SITE_URL` matches your deployment URL
- Check webhook URLs if using webhooks

## Redeployment

To redeploy after making changes:

1. Push changes to GitHub:
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

2. Vercel will automatically deploy (if auto-deploy is enabled)

Or manually trigger:
```bash
vercel --prod
```

## Monitoring

- View deployment logs in Vercel dashboard
- Monitor function execution and errors
- Check database usage in Storage tab

## Free Tier Limits

Vercel Free Tier includes:
- Unlimited deployments
- 100 GB bandwidth/month
- Serverless function execution: 100 GB-hours
- 1 concurrent build
- Vercel Postgres: 256 MB storage, 60 hours compute time

Monitor your usage in the Vercel dashboard to stay within limits.
