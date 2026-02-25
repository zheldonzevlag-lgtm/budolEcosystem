/**
 * Database Backup Script for Vercel Postgres
 * Creates a comprehensive backup using Prisma
 */

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

// Use direct URL if available, otherwise use the accelerate URL
let databaseUrl = process.env.DIRECT_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL
if (databaseUrl) {
    // Debugging logic
    console.log('DEBUG: Original URL length:', databaseUrl.length);
    console.log('DEBUG: First 20 chars:', databaseUrl.substring(0, 20));

    databaseUrl = databaseUrl.trim().replace(/^["']|["']$/g, '');
    // Ensure protocol is postgresql://
    if (databaseUrl.startsWith('postgres://')) {
        databaseUrl = databaseUrl.replace('postgres://', 'postgresql://');
    }

    console.log('DEBUG: Final URL to Prisma:', databaseUrl.substring(0, 15) + '...');
}

if (!databaseUrl) {
    console.error('❌ No database URL found in environment variables')
    console.error('   Please set DIRECT_URL, POSTGRES_URL, or DATABASE_URL')
    process.exit(1)
}

console.log('🔗 Using database URL:', (databaseUrl ? databaseUrl.substring(0, 30) : 'UNDEFINED') + '...')

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: databaseUrl
        }
    }
})

async function backupDatabase() {
    console.log('\n🔄 Starting database backup...\n')

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + new Date().getHours() + '-' + new Date().getMinutes()
    const backupsRoot = path.join(__dirname, '../backups')
    const backupDir = path.join(backupsRoot, timestamp)

    // Create backups root directory if it doesn't exist
    if (!fs.existsSync(backupsRoot)) {
        fs.mkdirSync(backupsRoot, { recursive: true })
    }

    // Create specific backup directory
    fs.mkdirSync(backupDir, { recursive: true })
    console.log(`✅ Created backup directory: ${backupDir}\n`)

    try {
        const metadata = {
            timestamp: new Date().toISOString(),
            database: 'budolshap-vercel-postgres',
            version: '1.0',
            tables: {}
        }

        console.log('📊 Fetching database statistics...\n')

        // Helper function to save table data
        const saveTable = async (name, queryPromise) => {
            console.log(`📦 Backing up ${name}...`)
            const data = await queryPromise
            fs.writeFileSync(path.join(backupDir, `${name.toLowerCase()}.json`), JSON.stringify(data, null, 2))
            metadata.tables[name.toLowerCase()] = data.length
            console.log(`   ✅ ${data.length} ${name} backed up`)
            return data.length
        }

        await saveTable('Users', prisma.user.findMany())
        await saveTable('Stores', prisma.store.findMany())
        await saveTable('Products', prisma.product.findMany())

        await saveTable('Orders', prisma.order.findMany({
            include: { orderItems: true }
        }))

        await saveTable('Addresses', prisma.address.findMany())

        await saveTable('Wallets', prisma.wallet.findMany({
            include: { transactions: true }
        }))

        await saveTable('Ratings', prisma.rating.findMany())

        await saveTable('Carts', prisma.cart.findMany({
            include: { items: true }
        }))

        await saveTable('Coupons', prisma.coupon.findMany())

        await saveTable('Chats', prisma.chat.findMany({
            include: { messages: true }
        }))

        await saveTable('Returns', prisma.return.findMany())

        // PayoutRequest file name needs to match restore expectation "payout-requests.json"
        console.log('📦 Backing up Payout Requests...')
        const payoutRequests = await prisma.payoutRequest.findMany()
        fs.writeFileSync(path.join(backupDir, 'payout-requests.json'), JSON.stringify(payoutRequests, null, 2))
        metadata.tables['payout-requests'] = payoutRequests.length
        console.log(`   ✅ ${payoutRequests.length} payout requests backed up`)

        // Save metadata
        fs.writeFileSync(path.join(backupDir, 'metadata.json'), JSON.stringify(metadata, null, 2))

        console.log('\n✅ Database backup completed successfully!')
        console.log('═'.repeat(60))
        console.log(`📂 Location: ${backupDir}`)
        console.log(`📅 Timestamp: ${metadata.timestamp}`)
        console.log('═'.repeat(60))

        return {
            success: true,
            directory: backupDir,
            records: Object.values(metadata.tables).reduce((a, b) => a + b, 0)
        }

    } catch (error) {
        console.error('\n❌ Backup failed:', error.message)
        console.error('\nFull error:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

// Run backup
backupDatabase()
    .then((result) => {
        console.log('\n🎉 Backup process completed successfully!')
        console.log(`✅ ${result.records} records backed up`)
        process.exit(0)
    })
    .catch((error) => {
        console.error('\n❌ Backup process failed')
        process.exit(1)
    })
