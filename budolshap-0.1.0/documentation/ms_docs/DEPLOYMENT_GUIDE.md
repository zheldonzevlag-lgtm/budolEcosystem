# 🚀 BudolShap Deployment Guide

Complete guide for deploying BudolShap to Vercel with PostgreSQL database.

## Table of Contents
- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Deployment Methods](#deployment-methods)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Troubleshooting](#troubleshooting)
- [Post-Deployment](#post-deployment)

---

## Quick Start

### Using the Deployment Script (Recommended)

**Windows (PowerShell):**
```powershell
# Navigate to project root
cd "c:\wamp64\www\budolshap - Copy (24)"

# Run deployment script
.\scripts\deploy.ps1 -Production
```

**Linux/Mac (Bash):**
```bash
# Navigate to project root
cd /path/to/budolshap

# Make script executable
chmod +x scripts/deploy.sh

# Run deployment script
./scripts/deploy.sh --production
```

### Script Options

**PowerShell:**
- `-Production` - Deploy to production (default is preview)
- `-SkipChecks` - Skip pre-deployment checks
- `-SkipMigration` - Skip database migration

**Bash:**
- `--production` - Deploy to production (default is preview)
- `--skip-checks` - Skip pre-deployment checks
- `--skip-migration` - Skip database migration

**Examples:**
```powershell
# Preview deployment with all checks
.\scripts\deploy.ps1

# Production deployment, skip migration
.\scripts\deploy.ps1 -Production -SkipMigration

# Quick deployment, skip all checks
.\scripts\deploy.ps1 -Production -SkipChecks -SkipMigration
```

---

## Prerequisites

### Required Software
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download](https://git-scm.com/)
- **Vercel CLI** - Install with: `npm install -g vercel`

### Required Accounts
- **Vercel Account** - [Sign up](https://vercel.com/signup)
- **GitHub Account** - [Sign up](https://github.com/signup)
- **Cloudinary Account** - [Sign up](https://cloudinary.com/users/register/free)
- **PayMongo Account** - [Sign up](https://dashboard.paymongo.com/signup)
- **Lalamove Account** - [Sign up](https://www.lalamove.com/partner)

### Verify Installation
```bash
node --version    # Should show v18.0.0 or higher
npm --version     # Should show 9.0.0 or higher
git --version     # Should show 2.0.0 or higher
vercel --version  # Should show latest version
```

---

## Deployment Methods

### Method 1: Automated Script (Recommended)

The deployment script handles everything automatically:
1. Pre-deployment checks
2. Vercel authentication
3. Project linking
4. Environment variable setup
5. Database migration
6. Build verification
7. Git commit and push
8. Deployment to Vercel
9. Post-deployment checklist

**See [Quick Start](#quick-start) for usage.**

### Method 2: Manual Deployment

#### Step 1: Login to Vercel
```bash
vercel login
```

#### Step 2: Link Project
```bash
vercel link
```
Follow the prompts to link to your existing project or create a new one.

#### Step 3: Set Environment Variables
Go to [Vercel Dashboard](https://vercel.com/derflanoj2s-projects/budolshap/settings/environment-variables) and add all required variables (see [Environment Variables](#environment-variables) section).

#### Step 4: Pull Environment Variables Locally
```bash
vercel env pull .env.production
```

#### Step 5: Run Database Migration
```bash
# Install dotenv-cli if not already installed
npm install -g dotenv-cli

# Run migration
npx dotenv -e .env.production -- npx prisma migrate deploy
```

#### Step 6: Deploy
```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

### Method 3: GitHub Integration (Continuous Deployment)

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com)
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure build settings:
   - **Framework Preset:** Next.js
   - **Build Command:** `prisma generate && next build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`
6. Add environment variables
7. Deploy

**Automatic Deployments:**
- Every push to `main` branch triggers a production deployment
- Every push to other branches triggers a preview deployment

---

## Environment Variables

### Critical Variables (Required)

#### Database Configuration
```env
DATABASE_PROVIDER=postgresql
POSTGRES_PRISMA_URL=<from Vercel Postgres>
POSTGRES_URL_NON_POOLING=<from Vercel Postgres>
POSTGRES_URL=<from Vercel Postgres>
```

#### Application Security
```env
JWT_SECRET=<generate a strong random string>
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
NEXT_PUBLIC_CURRENCY_SYMBOL=₱
```

### Third-Party Services

#### Cloudinary (Image Storage)
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### PayMongo (Payment Processing)
**⚠️ Use LIVE keys for production!**
```env
PAYMONGO_SECRET_KEY=sk_live_xxxxxxxxxxxxx
PAYMONGO_PUBLIC_KEY=pk_live_xxxxxxxxxxxxx
NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_live_xxxxxxxxxxxxx
```

#### Lalamove (Delivery Service)
**⚠️ Use production credentials!**
```env
LALAMOVE_API_KEY=your_production_api_key
LALAMOVE_API_SECRET=your_production_api_secret
LALAMOVE_ENVIRONMENT=production
```

#### Email (Nodemailer)
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@budolshap.com
```

### How to Set Environment Variables

#### Option 1: Vercel Dashboard
1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add each variable
4. Select environments: **Production**, **Preview**, **Development**

#### Option 2: Vercel CLI
```bash
vercel env add DATABASE_PROVIDER production
vercel env add JWT_SECRET production
# ... add all other variables
```

#### Option 3: Import from File
```bash
# Create a .env.production file with all variables
vercel env pull .env.production
```

### Generate Secure Secrets

**JWT_SECRET:**
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# OpenSSL
openssl rand -hex 64

# PowerShell
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

---

## Database Setup

### Create Vercel Postgres Database

1. Go to your [Vercel Project Dashboard](https://vercel.com/derflanoj2s-projects/budolshap)
2. Click on **Storage** tab
3. Click **Create Database**
4. Select **Postgres**
5. Enter database name: `budolshap-db`
6. Select region (choose closest to your users)
7. Click **Create**

### Configure Database Connection

After creating the database:
1. Go to the **.env.local** tab in Vercel Postgres
2. Copy the environment variables:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NO_SSL`
   - `POSTGRES_URL_NON_POOLING`
3. These are automatically added to your project

### Run Migrations

**Using the deployment script:**
The script will prompt you to run migrations automatically.

**Manually:**
```bash
# Pull production environment variables
vercel env pull .env.production

# Run migrations
npx dotenv -e .env.production -- npx prisma migrate deploy
```

### Seed Initial Data (Optional)

```bash
# Create admin account
npm run create-admin

# Seed test data
npm run db:seed
```

---

## Troubleshooting

### Common Issues

#### 1. Build Errors

**Error:** `Module not found` or `Cannot find module`
```bash
# Solution: Ensure all dependencies are installed
npm install
npm run build
```

**Error:** `Prisma Client not generated`
```bash
# Solution: Generate Prisma client
npx prisma generate
```

#### 2. Database Connection Issues

**Error:** `Can't reach database server`
```bash
# Check environment variables
vercel env ls

# Verify DATABASE_URL is set correctly
# Make sure POSTGRES_PRISMA_URL is set
```

**Error:** `P1001: Can't reach database server`
- Verify database is running in Vercel
- Check that `POSTGRES_PRISMA_URL` is set
- Ensure database region is accessible

#### 3. Environment Variable Issues

**Error:** Variables not loading
```bash
# Pull latest environment variables
vercel env pull .env.production

# Redeploy after adding variables
vercel --prod
```

**Missing variables:**
- Check Vercel Dashboard → Settings → Environment Variables
- Ensure variables are set for correct environment (Production/Preview)
- Redeploy after adding new variables

#### 4. Migration Errors

**Error:** `Migration failed`
```bash
# Reset database (⚠️ WARNING: This will delete all data!)
npx dotenv -e .env.production -- npx prisma migrate reset

# Or apply migrations manually
npx dotenv -e .env.production -- npx prisma db push
```

#### 5. PayMongo Integration Issues

**Error:** Payment not processing
- Verify you're using **LIVE** keys (sk_live_..., pk_live_...)
- Check `NEXT_PUBLIC_BASE_URL` matches your deployment URL
- Verify webhook URLs if using webhooks

#### 6. Lalamove Integration Issues

**Error:** Booking failed
- Ensure `LALAMOVE_ENVIRONMENT=production`
- Verify API credentials are for production
- Check phone numbers are in E.164 format

#### 7. Image Upload Issues

**Error:** Failed to upload to Cloudinary
- Verify Cloudinary credentials
- Check `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is set
- Ensure `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` are correct

### Debug Commands

```bash
# View deployment logs
vercel logs

# View recent logs
vercel logs --follow

# Check environment variables
vercel env ls

# Test database connection
npx prisma db pull

# Check build locally
npm run build
```

### Getting Help

1. **Check Vercel Logs:** `vercel logs`
2. **Check Build Logs:** In Vercel Dashboard → Deployments → Click on deployment
3. **Check Database Logs:** In Vercel Dashboard → Storage → Your database
4. **Contact Support:**
   - Vercel: [support.vercel.com](https://vercel.com/support)
   - PayMongo: [support@paymongo.com](mailto:support@paymongo.com)
   - Lalamove: [partner@lalamove.com](mailto:partner@lalamove.com)

---

## Post-Deployment

### Verification Checklist

After deployment, verify the following:

#### ✅ Core Functionality
- [ ] Application loads without errors
- [ ] Homepage displays correctly
- [ ] Product listings load
- [ ] Product details page works
- [ ] Images load from Cloudinary

#### ✅ Authentication
- [ ] User registration works
- [ ] Email verification sent
- [ ] Login works
- [ ] Logout works
- [ ] Password reset works

#### ✅ Shopping Features
- [ ] Add to cart works
- [ ] Cart page displays correctly
- [ ] Update cart quantities
- [ ] Remove from cart works
- [ ] Checkout process completes

#### ✅ Payment Integration
- [ ] PayMongo payment form loads
- [ ] Test payment succeeds
- [ ] Payment confirmation received
- [ ] Order created after payment

#### ✅ Delivery Integration
- [ ] Lalamove quote generation works
- [ ] Delivery booking succeeds
- [ ] Order appears in Lalamove portal

#### ✅ Admin Panel
- [ ] Admin login works
- [ ] Dashboard displays data
- [ ] Orders list loads
- [ ] Products management works
- [ ] User management works

#### ✅ Store Features
- [ ] Store creation works
- [ ] Store dashboard accessible
- [ ] Product creation works
- [ ] Order management works

### Performance Monitoring

**Vercel Analytics:**
1. Go to your project dashboard
2. Click on **Analytics** tab
3. Monitor:
   - Page load times
   - Core Web Vitals
   - Traffic patterns

**Database Monitoring:**
1. Go to **Storage** tab
2. Monitor:
   - Database size
   - Query performance
   - Connection pool usage

### Set Up Custom Domain (Optional)

1. Go to Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update environment variables:
   ```env
   NEXT_PUBLIC_BASE_URL=https://yourdomain.com
   ```
5. Redeploy

### Enable Automatic Deployments

1. Go to Vercel Dashboard → Settings → Git
2. Enable **Auto-deploy**
3. Configure branches:
   - `main` → Production
   - Other branches → Preview

### Set Up Monitoring & Alerts

**Vercel Monitoring:**
- Enable email notifications for failed deployments
- Set up Slack/Discord webhooks for deployment notifications

**Database Monitoring:**
- Monitor database usage in Vercel Storage tab
- Set up alerts for high usage

### Backup Strategy

**Database Backups:**
```bash
# Backup production database
npm run db:backup

# Restore from backup
npm run db:restore
```

**Automated Backups:**
- Vercel Postgres includes automatic daily backups
- Access backups in Storage → Your Database → Backups

---

## Deployment Workflow

### Development → Production Flow

1. **Develop Locally**
   ```bash
   npm run dev
   ```

2. **Test Changes**
   ```bash
   npm run build
   npm start
   ```

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "Your changes"
   ```

4. **Push to GitHub**
   ```bash
   git push origin main
   ```

5. **Deploy to Vercel**
   - Automatic (if GitHub integration enabled)
   - Or manual: `vercel --prod`

### Rollback Procedure

If deployment fails or has issues:

1. **Instant Rollback (Vercel Dashboard):**
   - Go to Deployments
   - Find previous working deployment
   - Click **Promote to Production**

2. **Git Rollback:**
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Manual Rollback:**
   ```bash
   vercel rollback
   ```

---

## Free Tier Limits

### Vercel Free Tier
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ 100 GB-hours serverless function execution
- ✅ 1 concurrent build
- ⚠️ 10 second serverless function timeout

### Vercel Postgres Free Tier
- ✅ 256 MB storage
- ✅ 60 hours compute time/month
- ⚠️ 1 database per project

**Monitor Usage:**
- Go to Vercel Dashboard → Usage
- Check bandwidth, function execution, and database usage

**Upgrade When Needed:**
- If you exceed limits, consider upgrading to Pro plan
- [Vercel Pricing](https://vercel.com/pricing)

---

## Security Best Practices

### Environment Variables
- ✅ Never commit `.env` files to Git
- ✅ Use different keys for development and production
- ✅ Rotate secrets regularly
- ✅ Use strong, random JWT secrets

### Database
- ✅ Use connection pooling (POSTGRES_PRISMA_URL)
- ✅ Enable SSL connections
- ✅ Regular backups
- ✅ Monitor for suspicious activity

### API Security
- ✅ Validate all inputs
- ✅ Use HTTPS only
- ✅ Implement rate limiting
- ✅ Sanitize user data

### Payment Security
- ✅ Use PayMongo's secure checkout
- ✅ Never store credit card details
- ✅ Use LIVE keys in production only
- ✅ Implement webhook signature verification

---

## Additional Resources

### Documentation
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PayMongo API Docs](https://developers.paymongo.com/docs)
- [Lalamove API Docs](https://developers.lalamove.com/)

### Support
- [Vercel Support](https://vercel.com/support)
- [Next.js Discord](https://discord.gg/nextjs)
- [Prisma Discord](https://discord.gg/prisma)

### Project Files
- Deployment Script: `scripts/deploy.ps1` or `scripts/deploy.sh`
- Workflow Guide: `.agent/workflows/deploy-vercel.md`
- Package Configuration: `package.json`
- Database Schema: `prisma/schema.prisma`

---

## Quick Reference

### Useful Commands

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# Pull environment variables
vercel env pull

# List environment variables
vercel env ls

# Check deployment status
vercel ls

# Rollback deployment
vercel rollback

# Open project in browser
vercel open

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# View database in browser
npx prisma studio
```

### Emergency Contacts

- **Vercel Status:** [vercel-status.com](https://www.vercel-status.com/)
- **PayMongo Status:** Check dashboard
- **Lalamove Support:** [partner@lalamove.com](mailto:partner@lalamove.com)

---

**Last Updated:** 2025-11-30  
**Version:** 1.0.0  
**Maintained by:** Antigravity AI

---

## Need Help?

If you encounter any issues not covered in this guide:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review Vercel deployment logs: `vercel logs`
3. Check the [Vercel Documentation](https://vercel.com/docs)
4. Contact Vercel support

**Happy Deploying! 🚀**
