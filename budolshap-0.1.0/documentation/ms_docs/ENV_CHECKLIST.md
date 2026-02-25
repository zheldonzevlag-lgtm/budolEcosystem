# Environment Variables Checklist for Vercel Deployment

## Required Environment Variables

Copy these from your `.env` or `.env.local` file and add them to Vercel:

### 1. Database (Automatically added by Vercel Postgres)
- [ ] `DATABASE_URL` - Auto-configured when you create Vercel Postgres
- [ ] `DIRECT_URL` - Auto-configured when you create Vercel Postgres

### 2. Authentication
- [ ] `NEXTAUTH_SECRET` - Your NextAuth secret key
- [ ] `NEXTAUTH_URL` - Set to your Vercel deployment URL (e.g., https://budolshap.vercel.app)
- [ ] `NEXT_PUBLIC_SITE_URL` - Same as NEXTAUTH_URL

### 3. Payment (PayMongo/GCash)
- [ ] `PAYMONGO_SECRET_KEY` - Your PayMongo secret key
- [ ] `PAYMONGO_PUBLIC_KEY` - Your PayMongo public key

### 4. Email (Nodemailer)
- [ ] `EMAIL_USER` - Your email address for sending emails
- [ ] `EMAIL_PASS` - Your email password or app-specific password

## How to Add Environment Variables in Vercel

1. Go to your project in Vercel Dashboard
2. Click **Settings** → **Environment Variables**
3. For each variable:
   - Enter the **Key** (variable name)
   - Enter the **Value** (from your .env file)
   - Select environments: **Production**, **Preview**, **Development**
   - Click **Save**

## Important Notes

✅ **DO NOT** commit `.env` or `.env.local` files to Git
✅ **DO** set variables for all three environments (Production, Preview, Development)
✅ **DO** redeploy after adding/updating environment variables
✅ **DO** update `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` to match your actual Vercel URL

## After Adding Variables

1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the three dots (•••)
4. Click **Redeploy**
5. Wait for deployment to complete

## Verification

After deployment, check:
- [ ] Application loads without errors
- [ ] Database connection works
- [ ] User authentication works
- [ ] Payment integration works
- [ ] Email sending works (if applicable)
