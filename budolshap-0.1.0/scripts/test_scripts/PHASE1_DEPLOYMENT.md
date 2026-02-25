# Phase 1 Deployment Instructions

## ✅ Completed Steps
1. Created new branch: `feature/escrow-implementation-phase1`
2. Added `pendingBalance` field to Wallet model
3. Created backup script: `scripts/backup-database-escrow.js`
4. Pushed to GitHub - Vercel will auto-deploy

## 🚀 Next Steps: Run on Vercel

### Step 1: Wait for Vercel Deployment
- Go to: https://vercel.com/dashboard
- Wait for deployment of `feature/escrow-implementation-phase1` to complete
- You'll see a preview URL (e.g., `budolshap-git-feature-escrow-xxxxx.vercel.app`)

### Step 2: Backup Database (CRITICAL!)
Run this command in Vercel's terminal or locally with production credentials:

```bash
node scripts/backup-database-escrow.js
```

**What it does:**
- Backs up all Wallets with current balances
- Backs up all Transactions
- Backs up all paid Orders
- Creates timestamped backup file in `/backups` folder
- Shows summary of backed up data

**Expected output:**
```
🔄 Starting database backup for escrow migration...
💰 Backing up Wallets...
   ✓ X wallets backed up
📊 Backing up Transactions...
   ✓ X transactions backed up
✅ Backup completed successfully!
```

### Step 3: Run Migration
After backup is complete, run:

```bash
npx prisma migrate deploy
```

**What it does:**
- Adds `pendingBalance` column to Wallet table
- Sets default value to 0 for all existing wallets
- Preserves all existing `balance` data

**Expected output:**
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database
1 migration found in prisma/migrations
Applying migration `20241208_add_pending_balance_to_wallet`
Migration applied successfully
```

### Step 4: Verify Migration
Run this query to verify the new field exists:

```bash
npx prisma studio
```

Or check in database:
```sql
SELECT id, balance, "pendingBalance", "createdAt" FROM "Wallet" LIMIT 5;
```

**Expected result:**
- All wallets should have `pendingBalance = 0`
- All existing `balance` values should be unchanged

## 🧪 Testing Phase 1

### Test 1: Check Wallet Schema
```bash
npx prisma db pull
```
Verify `pendingBalance` field exists in schema

### Test 2: Manual Wallet Check
```javascript
// In Vercel terminal or Node REPL
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  const wallet = await prisma.wallet.findFirst()
  console.log(wallet)
  // Should show: { id, storeId, balance, pendingBalance, ... }
}
test()
```

## ⚠️ Rollback Plan (if needed)

If something goes wrong:

1. **Restore from backup:**
```bash
node scripts/restore-from-backup.js backups/escrow-migration-backup-[timestamp].json
```

2. **Revert migration:**
```bash
npx prisma migrate resolve --rolled-back 20241208_add_pending_balance_to_wallet
```

3. **Redeploy previous branch:**
- In Vercel dashboard, redeploy the previous working commit

## 📊 Success Criteria

✅ Backup file created with all wallet data
✅ Migration applied without errors
✅ All existing wallets have `pendingBalance = 0`
✅ All existing `balance` values unchanged
✅ No errors in Vercel logs
✅ Application still loads correctly

## 🎯 What's Next

After successful Phase 1 deployment:
- Phase 2: Update PayMongo webhook to credit `pendingBalance`
- Phase 3: Create fund release logic
- Phase 4: Update seller dashboard UI

---

**Status:** Ready for deployment
**Branch:** `feature/escrow-implementation-phase1`
**Estimated Time:** 10-15 minutes
