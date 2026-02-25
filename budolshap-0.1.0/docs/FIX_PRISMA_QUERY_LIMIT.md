# Fix for Prisma Query Limit - Use Direct Database Connection

## Problem
Prisma Accelerate has reached monthly query limit, blocking all database queries.

## Solution
Switch to direct Postgres connection (bypass Prisma Accelerate)

## Steps:

### 1. Get Direct Connection URL from Vercel

Go to: https://vercel.com/derflanoj2s-projects/budolshap/storage

Find your Postgres database and copy these values:
- `POSTGRES_URL` (for DATABASE_URL)
- `POSTGRES_URL_NON_POOLING` (for DIRECT_URL)

### 2. Update Environment Variables in Vercel

Go to: https://vercel.com/derflanoj2s-projects/budolshap/settings/environment-variables

Update these variables:

**DATABASE_URL**
- OLD: `prisma+postgres://accelerate.prisma-data.net/...`
- NEW: `postgres://default:...@...vercel-storage.com:5432/verceldb`
  (Use the value from POSTGRES_URL)

**DIRECT_URL**
- OLD: May not exist or use Prisma Accelerate
- NEW: `postgres://default:...@...vercel-storage.com:5432/verceldb?sslmode=require`
  (Use the value from POSTGRES_URL_NON_POOLING)

### 3. Update Local .env.production

Edit: `c:\wamp64\www\budolshap - Copy (24)\.env.production`

Replace:
```
DATABASE_URL="prisma+postgres://..."
```

With the direct Postgres URL from Vercel (POSTGRES_URL value)

### 4. Redeploy

```bash
cd "c:\wamp64\www\budolshap - Copy (24)"
vercel --prod
```

### 5. Verify

After deployment:
- Go to https://budolshap.vercel.app/admin/users
- Users should now appear
- Database queries will work

## Why This Works

**Before (Blocked):**
```
App → Prisma Accelerate (BLOCKED) → Database
```

**After (Direct):**
```
App → Database (Direct connection, no limits)
```

## Notes

- This bypasses Prisma Accelerate completely
- No query limits from Prisma
- Slightly slower than Accelerate but works
- Your data is safe - nothing was deleted
- This is a Prisma billing issue, not a data issue

## Alternative: Upgrade Prisma

If you want to keep using Prisma Accelerate:
1. Go to https://console.prisma.io/derflanoj2/gocart/budolshap-v1-db/billing
2. Upgrade your plan
3. Increase query limits

---

**Status**: Temporary fix until Prisma limit resets or you upgrade
**Impact**: Users will show again, all features will work
**Data**: 100% safe and intact
