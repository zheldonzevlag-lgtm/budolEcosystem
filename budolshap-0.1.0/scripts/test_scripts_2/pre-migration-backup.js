/**
 * Pre-Migration Database Backup Script
 * 
 * This script backs up the database BEFORE adding pendingBalance field
 * Uses raw SQL to avoid Prisma schema conflicts
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function backupDatabase() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupDir = path.join(__dirname, '..', 'backups')
    const backupFile = path.join(backupDir, `pre-migration-backup-${timestamp}.json`)

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true })
    }

    console.log('🔄 Starting PRE-MIGRATION database backup...')
    console.log(`📁 Backup file: ${backupFile}`)

    try {
        const backup = {
            timestamp,
            version: '1.0',
            migration: 'BEFORE_add_pending_balance_to_wallet',
            data: {}
        }

        // Use raw SQL to avoid schema conflicts
        console.log('💰 Backing up Wallets (raw SQL)...')
        const wallets = await prisma.$queryRaw`SELECT * FROM "Wallet"`
        backup.data.wallets = wallets
        console.log(`   ✓ ${wallets.length} wallets backed up`)

        console.log('📊 Backing up Transactions...')
        const transactions = await prisma.$queryRaw`SELECT * FROM "Transaction"`
        backup.data.transactions = transactions
        console.log(`   ✓ ${transactions.length} transactions backed up`)

        console.log('📦 Backing up Paid Orders...')
        const orders = await prisma.$queryRaw`SELECT * FROM "Order" WHERE "isPaid" = true`
        backup.data.orders = orders
        console.log(`   ✓ ${orders.length} paid orders backed up`)

        console.log('💸 Backing up Payout Requests...')
        const payoutRequests = await prisma.$queryRaw`SELECT * FROM "PayoutRequest"`
        backup.data.payoutRequests = payoutRequests
        console.log(`   ✓ ${payoutRequests.length} payout requests backed up`)

        console.log('🏪 Backing up Stores...')
        const stores = await prisma.$queryRaw`SELECT id, "userId", name, email, status, "createdAt" FROM "Store"`
        backup.data.stores = stores
        console.log(`   ✓ ${stores.length} stores backed up`)

        // Write backup to file
        fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2))

        console.log('\n✅ Backup completed successfully!')
        console.log(`📄 Backup saved to: ${backupFile}`)
        console.log(`📊 Total size: ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB`)

        // Create summary
        const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0)
        const walletsWithBalance = wallets.filter(w => Number(w.balance) > 0).length

        const summary = {
            timestamp,
            file: backupFile,
            migration: 'BEFORE_add_pending_balance_to_wallet',
            counts: {
                wallets: wallets.length,
                transactions: transactions.length,
                orders: orders.length,
                payoutRequests: payoutRequests.length,
                stores: stores.length
            },
            criticalData: {
                walletsWithBalance,
                totalBalanceAmount: totalBalance
            }
        }

        console.log('\n📋 Backup Summary:')
        console.log(JSON.stringify(summary, null, 2))

        // Save summary
        const summaryFile = path.join(backupDir, `pre-migration-summary-${timestamp}.json`)
        fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2))

        console.log('\n⚠️  CRITICAL: This backup was taken BEFORE migration')
        console.log('✅ Safe to proceed with migration now!')

        return summary

    } catch (error) {
        console.error('❌ Backup failed:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

// Run backup
backupDatabase()
    .then((summary) => {
        console.log('\n✅ Pre-migration backup complete!')
        console.log('\n📌 Next step: Run migration with: npx prisma migrate deploy')
        process.exit(0)
    })
    .catch((error) => {
        console.error('\n❌ Backup error:', error)
        process.exit(1)
    })
