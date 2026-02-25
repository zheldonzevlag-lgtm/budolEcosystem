/**
 * Restore Unified Backup to Local Database
 * 
 * Usage: node scripts/restore-to-local.js [backup-file-path]
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('🚀 Starting Restore to Local Database...');

// 1. Load Local Environment
const envLocalPath = path.resolve(__dirname, '../.env.local');
const envPath = path.resolve(__dirname, '../.env');

let databaseUrl = null;

if (fs.existsSync(envLocalPath)) {
    console.log(`📄 Loading environment from ${path.basename(envLocalPath)}`);
    const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
    if (envConfig.DATABASE_URL) databaseUrl = envConfig.DATABASE_URL;
}

if (!databaseUrl && fs.existsSync(envPath)) {
    console.log(`📄 Loading environment from ${path.basename(envPath)}`);
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    if (envConfig.DATABASE_URL) databaseUrl = envConfig.DATABASE_URL;
}

if (!databaseUrl && process.env.DATABASE_URL) {
    console.log('📄 Using DATABASE_URL from system environment');
    databaseUrl = process.env.DATABASE_URL;
}

if (!databaseUrl) {
    console.error('❌ No DATABASE_URL found in .env.local or .env');
    process.exit(1);
}

// Clean URL
databaseUrl = databaseUrl.trim().replace(/^["']|["']$/g, '');
if (databaseUrl.startsWith('postgres://')) {
    databaseUrl = databaseUrl.replace('postgres://', 'postgresql://');
}

console.log('🔗 Connecting to:', databaseUrl.substring(0, 25) + '...');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: databaseUrl
        }
    }
});

async function restoreBackup(backupFilePath) {
    try {
        if (!fs.existsSync(backupFilePath)) {
            console.error(`❌ Backup file not found: ${backupFilePath}`);
            process.exit(1);
        }

        console.log(`\n📖 Reading backup file: ${path.basename(backupFilePath)}`);
        const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));

        if (!backupData.tables) {
            console.error('❌ Invalid backup format: missing "tables" property');
            process.exit(1);
        }

        console.log(`📅 Backup from: ${backupData.timestamp}\n`);
        console.log('⚠️  WARNING: This will overwrite data in the local database!');
        // In a real CLI we would ask for confirmation, but here we assume the user intends to restore.

        // Order of deletion (Reverse dependency order to avoid foreign key constraints)
        console.log('🗑️  Clearing existing local data...');
        const deleteOrder = [
            prisma.auditLog,
            prisma.message,
            prisma.chat,
            prisma.return,
            prisma.payoutRequest,
            prisma.transaction,
            prisma.wallet,
            prisma.cartItem,
            prisma.cart,
            prisma.rating,
            prisma.orderItem,
            prisma.order,
            prisma.product, // Product depends on Store
            prisma.storeAddress, // StoreAddress depends on Store
            prisma.store,   // Store depends on User
            prisma.address,
            prisma.coupon,
            prisma.systemSettings,
            prisma.user
        ];

        for (const model of deleteOrder) {
            try {
                // Check if model exists on prisma client (defensive)
                if (model) {
                    await model.deleteMany();
                }
            } catch (e) {
                console.log(`   ⚠️  Table clear warning: ${e.message.split('\n')[0]}`);
            }
        }
        console.log('✅ Existing data cleared\n');

        // Restore Order (Dependency order)
        console.log('🔄 Restoring data...');

        // 1. Users
        if (backupData.tables.users && backupData.tables.users.length) {
            console.log(`   Restoring ${backupData.tables.users.length} Users...`);
            for (const item of backupData.tables.users) {
                await prisma.user.create({ data: item });
            }
        }

        // 2. System Settings
        if (backupData.tables.systemSettings && backupData.tables.systemSettings.length) {
            console.log(`   Restoring ${backupData.tables.systemSettings.length} Settings...`);
            for (const item of backupData.tables.systemSettings) {
                await prisma.systemSettings.create({ data: item });
            }
        }

        // 3. Stores
        if (backupData.tables.stores && backupData.tables.stores.length) {
            console.log(`   Restoring ${backupData.tables.stores.length} Stores...`);
            for (const item of backupData.tables.stores) {
                await prisma.store.create({ data: item });
            }
        }

        // 4. Store Addresses
        if (backupData.tables.storeAddresses && backupData.tables.storeAddresses.length) {
            console.log(`   Restoring ${backupData.tables.storeAddresses.length} Store Addresses...`);
            for (const item of backupData.tables.storeAddresses) {
                await prisma.storeAddress.create({ data: item });
            }
        }

        // 5. Products
        if (backupData.tables.products && backupData.tables.products.length) {
            console.log(`   Restoring ${backupData.tables.products.length} Products...`);
            for (const item of backupData.tables.products) {
                await prisma.product.create({ data: item });
            }
        }

        // 6. Addresses
        if (backupData.tables.addresses && backupData.tables.addresses.length) {
            console.log(`   Restoring ${backupData.tables.addresses.length} Addresses...`);
            for (const item of backupData.tables.addresses) {
                await prisma.address.create({ data: item });
            }
        }

        // 7. Coupons
        if (backupData.tables.coupons && backupData.tables.coupons.length) {
            console.log(`   Restoring ${backupData.tables.coupons.length} Coupons...`);
            for (const item of backupData.tables.coupons) {
                await prisma.coupon.create({ data: item });
            }
        }

        // 8. Orders & Order Items
        if (backupData.tables.orders && backupData.tables.orders.length) {
            console.log(`   Restoring ${backupData.tables.orders.length} Orders...`);
            for (const order of backupData.tables.orders) {
                const { orderItems, ...orderData } = order;
                await prisma.order.create({
                    data: {
                        ...orderData,
                        orderItems: {
                            create: orderItems || []
                        }
                    }
                });
            }
        }

        // 9. Carts & Cart Items
        if (backupData.tables.carts && backupData.tables.carts.length) {
            console.log(`   Restoring ${backupData.tables.carts.length} Carts...`);
            for (const cart of backupData.tables.carts) {
                const { items, ...cartData } = cart;
                await prisma.cart.create({
                    data: {
                        ...cartData,
                        items: {
                            create: items || []
                        }
                    }
                });
            }
        }

        // 10. Wallets & Transactions
        if (backupData.tables.wallets && backupData.tables.wallets.length) {
            console.log(`   Restoring ${backupData.tables.wallets.length} Wallets...`);
            for (const wallet of backupData.tables.wallets) {
                const { transactions, ...walletData } = wallet;
                await prisma.wallet.create({
                    data: {
                        ...walletData,
                        transactions: {
                            create: transactions || []
                        }
                    }
                });
            }
        }

        // 11. Ratings
        if (backupData.tables.ratings && backupData.tables.ratings.length) {
            console.log(`   Restoring ${backupData.tables.ratings.length} Ratings...`);
            for (const item of backupData.tables.ratings) {
                await prisma.rating.create({ data: item });
            }
        }

        // 12. Chats & Messages
        if (backupData.tables.chats && backupData.tables.chats.length) {
            console.log(`   Restoring ${backupData.tables.chats.length} Chats...`);
            for (const chat of backupData.tables.chats) {
                const { messages, ...chatData } = chat;
                await prisma.chat.create({
                    data: {
                        ...chatData,
                        messages: {
                            create: messages || []
                        }
                    }
                });
            }
        }

        console.log('\n✅ Restore completed successfully!');

    } catch (error) {
        console.error('\n❌ Restore failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

const backupFile = process.argv[2];
if (!backupFile) {
    console.log('Usage: node scripts/restore-to-local.js backups/your-backup-file.json');
    process.exit(1);
}

restoreBackup(backupFile);
