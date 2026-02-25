# Quick Vercel Deployment Guide

## Issue Encountered
Git author email mismatch with Vercel team. Solution: Deploy via Vercel Dashboard.

## Step-by-Step Deployment

### Step 1: Fix GitHub Repository Access

You have two options:

#### Option A: Create a New GitHub Repository
1. Go to https://github.com/new
2. Create a new repository named `budolshap`
3. **DO NOT** initialize with README
4. Copy the repository URL

Then update your Git remote:
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/budolshap.git
git push -u origin main
```

#### Option B: Add reynaldomgalvez@icloud.com to Vercel Team
1. Go to Vercel Dashboard → Settings → Members
2. Invite `reynaldomgalvez@icloud.com` to the team
3. Accept the invitation
4. Then run: `vercel --scope derflanoj2s-projects`

### Step 2: Deploy via Vercel Dashboard

1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select your GitHub account
4. Find and import your `budolshap` repository
5. Configure the project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./`
   - **Build Command**: `prisma generate && next build` (already in package.json)
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

6. Click **"Deploy"**

### Step 3: Set Up Vercel Postgres

1. After deployment, go to your project dashboard
2. Click **"Storage"** tab
3. Click **"Create Database"**
4. Select **"Postgres"**
5. Name: `budolshap-db`
6. Region: Choose closest to your users (e.g., Singapore for Philippines)
7. Click **"Create"**

### Step 4: Configure Environment Variables

Go to **Settings** → **Environment Variables** and add:

#### Database (Auto-added by Vercel Postgres)
- `DATABASE_URL` - Will be set automatically
- `DIRECT_URL` - Will be set automatically

#### Application Variables (Add these manually)
Copy from your `.env` file:

```
NEXTAUTH_SECRET=your_secret_here
NEXTAUTH_URL=https://your-project.vercel.app
NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app
PAYMONGO_SECRET_KEY=your_paymongo_secret
PAYMONGO_PUBLIC_KEY=your_paymongo_public
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
```

**Important**: Set these for all environments (Production, Preview, Development)

### Step 5: Redeploy

After adding environment variables:
1. Go to **Deployments** tab
2. Click the three dots on the latest deployment
3. Click **"Redeploy"**

### Step 6: Run Database Migrations

After successful deployment:

```bash
# Pull environment variables from Vercel
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy
```

Or add this to your `package.json` scripts:
```json
"postbuild": "prisma migrate deploy"
```

### Step 7: Verify Deployment

Visit your deployment URL and test:
- [ ] Homepage loads
- [ ] User registration/login works
- [ ] Products display correctly
- [ ] Cart functionality works
- [ ] Admin panel accessible

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify Prisma schema is correct

### Database Connection Issues
- Verify `DATABASE_URL` is set
- Check Prisma schema uses `postgresql` provider
- Ensure migrations are applied

### Environment Variables Not Working
- Redeploy after adding variables
- Check variables are set for correct environment
- Verify variable names match exactly

## Quick Commands Reference

```bash
# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Pull environment variables
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

## Next Steps After Deployment

1. **Test all features thoroughly**
2. **Set up custom domain** (optional)
3. **Monitor usage** in Vercel dashboard
4. **Set up error tracking** (optional: Sentry)
5. **Configure webhooks** for PayMongo if needed

## Support

- Vercel Docs: https://vercel.com/docs
- Prisma Docs: https://www.prisma.io/docs
- Next.js Docs: https://nextjs.org/docs
