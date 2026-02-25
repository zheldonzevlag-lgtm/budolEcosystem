# Database Migration Guide - Old to New Vercel Postgres

## Overview
Migrate from suspended `budolshap-db` to new Vercel Postgres database.

## ⚠️ Important Notes

1. **Your data is safe** - The old database is just suspended, not deleted
2. **This will NOT affect the driver info updates** - Those were already saved
3. **You'll have a fresh start** with a new database
4. **All data will be migrated** - Users, orders, products, stores, etc.

## Step-by-Step Migration

### Phase 1: Export Current Data (If Possible)

If the database is still accessible:

```bash
cd "c:\wamp64\www\budolshap - Copy (24)"
node scripts/export-database.js
```

This creates backup files:
- `backup-users.json`
- `backup-stores.json`
- `backup-products.json`
- `backup-orders.json`
- `backup-categories.json`
- `backup-addresses.json`

**If export fails** (database fully suspended):
- Skip to Phase 2
- You'll start fresh with a new database
- Contact Vercel support to get data from old database

### Phase 2: Create New Database

1. Go to: https://vercel.com/derflanoj2s-projects/budolshap/stores
2. Click **"Create Database"**
3. Select **"Postgres"**
4. Name: `budolshap-db-v2`
5. Region: Choose closest to your users (e.g., Singapore for PH)
6. Click **"Create"**

### Phase 3: Update Environment Variables

After database creation, Vercel shows connection strings.

#### In Vercel Dashboard:

Go to: https://vercel.com/derflanoj2s-projects/budolshap/settings/environment-variables

**Update these variables:**

1. **DATABASE_URL**
   - Delete old value
   - Add new: Copy `POSTGRES_PRISMA_URL` from new database
   - Environment: Production, Preview, Development

2. **DIRECT_URL**
   - Delete old value
   - Add new: Copy `POSTGRES_URL_NON_POOLING` from new database
   - Environment: Production, Preview, Development

#### In Local `.env.production`:

```bash
# Update these in: c:\wamp64\www\budolshap - Copy (24)\.env.production

DATABASE_URL="[paste POSTGRES_PRISMA_URL from new database]"
DIRECT_URL="[paste POSTGRES_URL_NON_POOLING from new database]"
```

### Phase 4: Run Database Migrations

```bash
cd "c:\wamp64\www\budolshap - Copy (24)"

# Apply schema to new database
npx prisma migrate deploy

# Or if that fails, use push
npx prisma db push
```

### Phase 5: Create Admin Account

```bash
# Create your admin account in new database
node scripts/create-admin.js
```

When prompted:
- Name: Your name
- Email: Your email
- Password: Your password

### Phase 6: Import Data (If You Have Backups)

If you successfully exported data in Phase 1:

```bash
# Import script will be created after export
node scripts/import-database.js
```

**If you don't have backups:**
- You'll start fresh
- Create new test data
- Or contact Vercel support to get old data

### Phase 7: Deploy

```bash
vercel --prod
```

### Phase 8: Verify

1. Go to: https://budolshap.vercel.app/admin/users
2. Check if admin user appears
3. Test login
4. Verify all features work

## Alternative: Use PostgreSQL Dump (Advanced)

If you have `pg_dump` installed:

```bash
# Export from old database
pg_dump [OLD_DATABASE_URL] > backup.sql

# Import to new database
psql [NEW_DATABASE_URL] < backup.sql
```

## What Gets Migrated

✅ **Will be migrated** (if export successful):
- All users
- All stores
- All products
- All orders (including driver info)
- All categories
- All addresses
- All reviews
- All coupons
- All memberships

❌ **Will NOT be migrated** (if starting fresh):
- You'll need to recreate test data
- Or contact Vercel support for data recovery

## Cost Comparison

### Old Database (Suspended)
- Free tier
- 387k operations used
- Suspended due to limits

### New Database Options

**Free Tier:**
- 256 MB storage
- 60 hours compute time/month
- Good for testing/development

**Pro Tier ($20/month):**
- 512 MB storage
- Unlimited compute time
- Better for production

**Recommendation:** Start with Free tier, upgrade if needed

## Troubleshooting

### "Migration failed"
- Check DATABASE_URL is correct
- Ensure new database is active
- Try `npx prisma db push` instead

### "Cannot connect to database"
- Verify environment variables in Vercel
- Check database region matches app region
- Wait a few minutes after creation

### "Data export failed"
- Old database might be fully suspended
- Contact Vercel support for data recovery
- Or start fresh with new database

## Recovery Plan

If you need data from old database:

1. **Contact Vercel Support**:
   - Go to: https://vercel.com/support
   - Subject: "Need to recover data from suspended Postgres database"
   - Provide: Database name (`budolshap-db`), project name
   - Request: Temporary reactivation for data export

2. **Upgrade Old Database**:
   - Pay for one month of Pro tier
   - Export all data
   - Cancel subscription
   - Import to new free database

## Timeline

- **Phase 1-2**: 5 minutes (create database)
- **Phase 3-4**: 10 minutes (update env vars, run migrations)
- **Phase 5**: 2 minutes (create admin)
- **Phase 6**: 5-30 minutes (import data, if available)
- **Phase 7-8**: 5 minutes (deploy and verify)

**Total**: 30-60 minutes

## Final Checklist

- [ ] New database created
- [ ] Environment variables updated in Vercel
- [ ] Environment variables updated in `.env.production`
- [ ] Migrations applied (`npx prisma migrate deploy`)
- [ ] Admin account created
- [ ] Data imported (if available)
- [ ] Deployed to production (`vercel --prod`)
- [ ] Verified admin panel works
- [ ] Tested login and features

---

**Status**: Ready to migrate
**Risk**: Low (old data is safe, just suspended)
**Recommendation**: Create new database and start fresh if export fails
