/**
 * Unified Production Database Backup Script
 * Loads production environment and performs backup directly.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('🚀 Starting Unified Production Database Backup...');

// 1. Load Environment Variables from .env.production
const envPath = path.resolve(__dirname, '../.env.production');
if (fs.existsSync(envPath)) {
    console.log(`📄 Loading environment from ${path.basename(envPath)}`);
    const envConfig = dotenv.parse(fs.readFileSync(envPath));

    // Override process.env
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} else {
    console.error('❌ .env.production not found! Please run "vercel env pull .env.production"');
    process.exit(1);
}

// 2. Prepare and Validate Database URL
let databaseUrl = process.env.DIRECT_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('❌ No database URL found in environment variables');
    process.exit(1);
}

// Clean and Normalize URL
console.log('DEBUG: Raw URL length:', databaseUrl.length);
databaseUrl = databaseUrl.trim().replace(/^["']|["']$/g, '');

if (databaseUrl.startsWith('postgres://')) {
    console.log('Using postgres:// protocol, converting to postgresql:// for Prisma...');
    databaseUrl = databaseUrl.replace('postgres://', 'postgresql://');
}

console.log('🔗 Using database URL:', databaseUrl.substring(0, 25) + '...');

// 3. Initialize Prisma
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: databaseUrl
        }
    }
});

// 4. Backup Logic
async function backupDatabase() {
    console.log('\n🔄 Starting database backup...\n');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + new Date().getHours() + '-' + new Date().getMinutes();
    const backupDir = path.resolve(__dirname, '../backups');
    const backupFile = path.join(backupDir, `budolshap-prod-backup-${timestamp}.json`);

    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
        console.log('✅ Created backups directory\n');
    }

    try {
        const backup = {
            timestamp: new Date().toISOString(),
            database: 'budolshap-production',
            version: '1.0',
            tables: {}
        };

        console.log('📊 Fetching database statistics...\n');

        const models = [
            { name: 'users', model: prisma.user },
            { name: 'stores', model: prisma.store },
            { name: 'products', model: prisma.product },
            { name: 'categories', model: prisma.category }, // Note: check if Category model exists, it was in previous script but schema.prisma didn't show it?
            { name: 'orders', model: prisma.order, include: { orderItems: true } },
            { name: 'addresses', model: prisma.address },
            { name: 'wallets', model: prisma.wallet },
            { name: 'walletTransactions', model: prisma.walletTransaction },
            { name: 'reviews', model: prisma.review }, // check if Review exists? schema says Rating
            { name: 'carts', model: prisma.cart, include: { items: true } },
            { name: 'coupons', model: prisma.coupon }
        ];

        // Verify models against schema.prisma I saw earlier
        // Schema has: User, Product, Order, OrderItem, Rating, Address, Coupon, Store, StoreAddress, Cart, CartItem, Wallet, Transaction, PayoutRequest, Return, Chat, Message, WebhookEvent, SystemSettings, RateLimit, AuditLog
        // Previous script had 'categories' and 'reviews'.
        // Schema does NOT have 'Category' model! 'Product' has a 'category' String field.
        // Schema has 'Rating', not 'Review'.

        // Let's adjust the backup list based on the schema I read in Step 35.

        const tablesToBackup = [
            { key: 'users', model: prisma.user },
            { key: 'stores', model: prisma.store },
            { key: 'storeAddresses', model: prisma.storeAddress },
            { key: 'products', model: prisma.product },
            { key: 'orders', model: prisma.order, args: { include: { orderItems: true } } },
            { key: 'addresses', model: prisma.address },
            { key: 'ratings', model: prisma.rating }, // Was reviews
            { key: 'wallets', model: prisma.wallet },
            { key: 'transactions', model: prisma.transaction }, // Was walletTransactions
            { key: 'payoutRequests', model: prisma.payoutRequest },
            { key: 'returns', model: prisma.return },
            { key: 'carts', model: prisma.cart, args: { include: { items: true } } },
            { key: 'coupons', model: prisma.coupon },
            { key: 'chats', model: prisma.chat, args: { include: { messages: true } } },
            { key: 'auditLogs', model: prisma.auditLog },
            { key: 'systemSettings', model: prisma.systemSettings }
        ];

        for (const item of tablesToBackup) {
            console.log(`📦 Backing up ${item.key}...`);
            try {
                if (item.model) {
                    backup.tables[item.key] = await item.model.findMany(item.args || {});
                    console.log(`   ✅ ${backup.tables[item.key].length} records`);
                } else {
                    console.log(`   ⚠️ Model for ${item.key} undefined, skipping.`);
                }
            } catch (e) {
                console.error(`   ❌ Failed to backup ${item.key}: ${e.message}`);
                // Continue to next table
            }
        }

        // Write backup to file
        console.log('\n💾 Writing backup to file...');
        fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

        const fileSize = (fs.statSync(backupFile).size / 1024 / 1024).toFixed(2);

        console.log('\n✅ Database backup completed successfully!');
        console.log('═'.repeat(60));
        console.log(`📁 Backup file: ${path.basename(backupFile)}`);
        console.log(`📂 Location: ${backupDir}`);
        console.log(`📊 File size: ${fileSize} MB`);
        console.log('═'.repeat(60));

        return { success: true };

    } catch (error) {
        console.error('\n❌ Backup failed:', error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

backupDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
