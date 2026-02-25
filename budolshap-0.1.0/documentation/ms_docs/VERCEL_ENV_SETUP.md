# Vercel Environment Variables Configuration

## Required Environment Variables for Production

When deploying to Vercel with PostgreSQL, set these environment variables in your Vercel project settings:

### 1. Database Configuration

**DATABASE_PROVIDER**
```
postgresql
```

> **Note**: Vercel Postgres automatically provides:
> - `POSTGRES_PRISMA_URL`
> - `POSTGRES_URL_NON_POOLING`
> - `POSTGRES_URL`
> 
> These are automatically mapped to `DATABASE_URL` and `DIRECT_URL` by the app.

### 2. Application Settings

**NODE_ENV**
```
production
```

**NEXT_PUBLIC_CURRENCY_SYMBOL**
```
₱
```

**JWT_SECRET**
```
[Generate a strong random string - NEVER use the development key]
```
Generate using:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Cloudinary Configuration

**NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME**
```
your-production-cloud-name
```

**CLOUDINARY_API_KEY**
```
your-production-api-key
```

**CLOUDINARY_API_SECRET**
```
your-production-api-secret
```

### 4. Email Configuration

**EMAIL_HOST**
```
smtp.gmail.com
```

**EMAIL_PORT**
```
587
```

**EMAIL_USER**
```
your-production-email@gmail.com
```

**EMAIL_PASSWORD**
```
your-app-specific-password
```

**EMAIL_FROM**
```
noreply@yourdomain.com
```

### 5. PayMongo Configuration (Production)

**PAYMONGO_SECRET_KEY**
```
sk_live_your_live_secret_key
```

**PAYMONGO_PUBLIC_KEY**
```
pk_live_your_live_public_key
```

**NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY**
```
pk_live_your_live_public_key
```

> ⚠️ **Important**: Use LIVE keys for production, not test keys!

### 6. Lalamove Configuration (Production)

**LALAMOVE_API_KEY**
```
your-production-api-key
```

**LALAMOVE_API_SECRET**
```
your-production-api-secret
```

**LALAMOVE_ENVIRONMENT**
```
production
```

> ⚠️ **Important**: Switch from `sandbox` to `production` for live deliveries!

### 7. Deployment Configuration

**NEXT_PUBLIC_BASE_URL**
```
https://your-domain.vercel.app
```

---

## How to Set Environment Variables in Vercel

### Method 1: Vercel Dashboard (Recommended)

1. Go to your project on [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - **Key**: Variable name (e.g., `DATABASE_PROVIDER`)
   - **Value**: Variable value (e.g., `postgresql`)
   - **Environment**: Select `Production`, `Preview`, and/or `Development`
5. Click **Save**

### Method 2: Vercel CLI

```bash
# Set a single variable
vercel env add DATABASE_PROVIDER production

# When prompted, enter: postgresql

# Set multiple variables from a file
vercel env pull .env.production
```

### Method 3: Import from File

1. Create a `.env.production` file locally (DO NOT commit this!)
2. In Vercel Dashboard → Settings → Environment Variables
3. Click **Import** → Select your file
4. Review and confirm

---

## Environment Variable Scopes

Vercel allows you to set variables for different environments:

- **Production**: Used for production deployments (main branch)
- **Preview**: Used for preview deployments (PRs, other branches)
- **Development**: Used for local development with `vercel dev`

### Recommended Setup

| Variable | Production | Preview | Development |
|----------|-----------|---------|-------------|
| DATABASE_PROVIDER | ✅ postgresql | ✅ postgresql | ❌ (use local .env) |
| JWT_SECRET | ✅ Strong key | ✅ Different key | ❌ (use local .env) |
| PAYMONGO_* | ✅ Live keys | ✅ Test keys | ❌ (use local .env) |
| LALAMOVE_ENVIRONMENT | ✅ production | ✅ sandbox | ❌ (use local .env) |

---

## Vercel Postgres Setup

### Step-by-Step Guide

1. **Create Postgres Database**:
   - In Vercel Dashboard → Your Project → **Storage**
   - Click **Create Database**
   - Select **Postgres**
   - Choose a region (closest to your users)
   - Click **Create**

2. **Connect to Project**:
   - Vercel will automatically connect the database
   - Environment variables are automatically added:
     - `POSTGRES_PRISMA_URL`
     - `POSTGRES_URL_NON_POOLING`
     - `POSTGRES_URL`

3. **Run Migrations**:
   
   **Option A: Via Vercel CLI**
   ```bash
   vercel env pull .env.production.local
   npx prisma migrate deploy
   ```

   **Option B: Via Build Command**
   
   In `package.json`, update build script:
   ```json
   {
     "scripts": {
       "build": "prisma generate && prisma migrate deploy && next build"
     }
   }
   ```

4. **Verify Connection**:
   ```bash
   # Pull environment variables
   vercel env pull

   # Test connection
   npx prisma db pull
   ```

---

## Security Best Practices

### ✅ DO:
- Use strong, randomly generated secrets for production
- Use live API keys for production services
- Set different secrets for Production vs Preview
- Regularly rotate sensitive credentials
- Use Vercel's encrypted environment variables

### ❌ DON'T:
- Commit `.env` files with real credentials
- Use development/test keys in production
- Share production credentials in code or documentation
- Use the same JWT_SECRET across environments

---

## Verifying Your Setup

After setting all environment variables:

1. **Check Variables**:
   ```bash
   vercel env ls
   ```

2. **Deploy**:
   ```bash
   git push
   ```

3. **Check Deployment Logs**:
   - Go to Vercel Dashboard → Deployments
   - Click on latest deployment
   - Check build logs for:
     ```
     🔵 Using PostgreSQL (Production/Vercel)
     ```

4. **Test Database Connection**:
   - Visit your deployed app
   - Try creating an account
   - Check if data is saved

---

## Troubleshooting

### Database Connection Errors

**Error: DATABASE_URL is not set**
- Ensure Vercel Postgres is connected to your project
- Check that `POSTGRES_PRISMA_URL` exists in environment variables

**Error: Can't reach database server**
- Verify Vercel Postgres is in the same region as your deployment
- Check database status in Vercel Dashboard

### Migration Errors

**Error: Migration failed**
```bash
# Pull production environment
vercel env pull .env.production.local

# Run migrations manually
npx prisma migrate deploy

# Redeploy
git commit --allow-empty -m "Run migrations"
git push
```

### Build Errors

**Error: Prisma Client not generated**
- Ensure `prisma generate` is in your build command
- Check `package.json` build script includes it

---

## Quick Reference

### Essential Commands

```bash
# Pull environment variables
vercel env pull

# List all environment variables
vercel env ls

# Add a new variable
vercel env add VARIABLE_NAME production

# Remove a variable
vercel env rm VARIABLE_NAME production

# Deploy
git push

# View logs
vercel logs
```

### Required Variables Checklist

- [ ] DATABASE_PROVIDER=postgresql
- [ ] JWT_SECRET (strong random string)
- [ ] NEXT_PUBLIC_CURRENCY_SYMBOL=₱
- [ ] Cloudinary credentials (all 3)
- [ ] Email configuration (all 5)
- [ ] PayMongo LIVE keys (all 3)
- [ ] Lalamove production credentials (all 3)
- [ ] NEXT_PUBLIC_BASE_URL (your Vercel URL)

---

## Need Help?

- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)
- [Prisma Deployment Docs](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
