/**
 * Database Backup Script for Vercel Postgres
 * 
 * This script creates a backup of all tables before running migrations
 * Run this before deploying schema changes
 * 
 * Usage: node scripts/backup-database-escrow.js
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function backupDatabase() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupDir = path.join(__dirname, '..', 'backups')
    const backupFile = path.join(backupDir, `escrow-migration-backup-${timestamp}.json`)

    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true })
    }

    console.log('🔄 Starting database backup for escrow migration...')
    console.log(`📁 Backup file: ${backupFile}`)

    try {
        const backup = {
            timestamp,
            version: '1.0',
            migration: 'add_pending_balance_to_wallet',
            data: {}
        }

        // Backup Wallets (CRITICAL for escrow)
        console.log('💰 Backing up Wallets...')
        backup.data.wallets = await prisma.wallet.findMany({
            include: {
                store: {
                    select: {
                        id: true,
                        name: true,
                        userId: true
                    }
                },
                transactions: true
            }
        })
        console.log(`   ✓ ${backup.data.wallets.length} wallets backed up`)

        // Backup Transactions
        console.log('📊 Backing up Transactions...')
        backup.data.transactions = await prisma.transaction.findMany()
        console.log(`   ✓ ${backup.data.transactions.length} transactions backed up`)

        // Backup Orders (for reference)
        console.log('📦 Backing up Orders...')
        backup.data.orders = await prisma.order.findMany({
            where: {
                isPaid: true
            },
            include: {
                orderItems: true,
                store: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        })
        console.log(`   ✓ ${backup.data.orders.length} paid orders backed up`)

        // Backup PayoutRequests
        console.log('💸 Backing up Payout Requests...')
        backup.data.payoutRequests = await prisma.payoutRequest.findMany()
        console.log(`   ✓ ${backup.data.payoutRequests.length} payout requests backed up`)

        // Backup Stores
        console.log('🏪 Backing up Stores...')
        backup.data.stores = await prisma.store.findMany({
            select: {
                id: true,
                userId: true,
                name: true,
                email: true,
                status: true,
                createdAt: true
            }
        })
        console.log(`   ✓ ${backup.data.stores.length} stores backed up`)

        // Write backup to file
        fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2))

        console.log('\n✅ Backup completed successfully!')
        console.log(`📄 Backup saved to: ${backupFile}`)
        console.log(`📊 Total size: ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB`)

        // Create backup summary
        const summary = {
            timestamp,
            file: backupFile,
            migration: 'add_pending_balance_to_wallet',
            counts: {
                wallets: backup.data.wallets.length,
                transactions: backup.data.transactions.length,
                orders: backup.data.orders.length,
                payoutRequests: backup.data.payoutRequests.length,
                stores: backup.data.stores.length
            },
            totalBalance: backup.data.wallets.reduce((sum, w) => sum + w.balance, 0),
            criticalData: {
                walletsWithBalance: backup.data.wallets.filter(w => w.balance > 0).length,
                totalBalanceAmount: backup.data.wallets.reduce((sum, w) => sum + w.balance, 0)
            }
        }

        console.log('\n📋 Backup Summary:')
        console.log(JSON.stringify(summary, null, 2))

        // Save summary separately
        const summaryFile = path.join(backupDir, `escrow-migration-summary-${timestamp}.json`)
        fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2))

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
        console.log('\n✅ Database backup complete!')
        console.log('\n⚠️  IMPORTANT: Keep this backup safe before running migration!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('\n❌ Backup error:', error)
        process.exit(1)
    })
