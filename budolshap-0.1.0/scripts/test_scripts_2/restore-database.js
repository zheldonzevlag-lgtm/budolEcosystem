/**
 * Script to restore database data from JSON backup files
 * 
 * Usage: node scripts/restore-database.js [backup-folder-name]
 * Example: node scripts/restore-database.js 2025-11-23T06-45-00
 * 
 * If no folder is specified, it will list available backups.
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient({
    log: ['error', 'warn']
});

async function listBackups() {
    const backupsDir = resolve(process.cwd(), 'backups')
    if (!existsSync(backupsDir)) {
        console.log('❌ No backups directory found')
        return []
    }

    const backups = readdirSync(backupsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .sort()
        .reverse()

    return backups
}

async function restoreDatabase(backupFolder) {
    try {
        console.log('🔄 Starting database restore...\n')

        const backupDir = resolve(process.cwd(), 'backups', backupFolder)

        if (!existsSync(backupDir)) {
            console.error(`❌ Backup folder not found: ${backupDir}`)
            console.log('\n📁 Available backups:')
            const backups = await listBackups()
            backups.forEach(backup => console.log(`   - ${backup}`))
            process.exit(1)
        }

        console.log(`📁 Restoring from: ${backupDir}\n`)

        // Read metadata
        const metadataPath = resolve(backupDir, 'metadata.json')
        if (existsSync(metadataPath)) {
            const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'))
            console.log('📊 Backup metadata:')
            console.log(`   Created: ${metadata.timestamp}`)
            console.log(`   Tables: ${Object.keys(metadata.tables).length}`)
            console.log('')
        }

        // Clear existing data (in reverse order of dependencies)
        console.log('🗑️  Clearing existing data...')
        const deleteTables = [
            'message', 'chat', 'return', 'payoutRequest', 'transaction',
            'wallet', 'cartItem', 'cart', 'rating', 'orderItem',
            'order', 'address', 'product', 'coupon', 'store', 'user'
        ]

        for (const table of deleteTables) {
            try {
                await prisma[table].deleteMany()
            } catch (error) {
                // Ignore errors if table doesn't exist or other cleanup issues
                // console.warn(`   ⚠️  Could not clear table ${table}: ${error.message}`)
            }
        }
        console.log('✅ Existing data cleared\n')

        // Restore Users
        const usersPath = resolve(backupDir, 'users.json')
        if (existsSync(usersPath)) {
            console.log('Restoring users...')
            const users = JSON.parse(readFileSync(usersPath, 'utf8'))
            for (const user of users) {
                await prisma.user.create({ data: user })
            }
            console.log(`✅ Restored ${users.length} users`)
        }

        // Restore Stores
        const storesPath = resolve(backupDir, 'stores.json')
        if (existsSync(storesPath)) {
            console.log('Restoring stores...')
            const stores = JSON.parse(readFileSync(storesPath, 'utf8'))
            for (const store of stores) {
                await prisma.store.create({ data: store })
            }
            console.log(`✅ Restored ${stores.length} stores`)
        }

        // Restore Products
        const productsPath = resolve(backupDir, 'products.json')
        if (existsSync(productsPath)) {
            console.log('Restoring products...')
            const products = JSON.parse(readFileSync(productsPath, 'utf8'))
            for (const product of products) {
                await prisma.product.create({ data: product })
            }
            console.log(`✅ Restored ${products.length} products`)
        }

        // Restore Addresses
        const addressesPath = resolve(backupDir, 'addresses.json')
        if (existsSync(addressesPath)) {
            console.log('Restoring addresses...')
            const addresses = JSON.parse(readFileSync(addressesPath, 'utf8'))
            for (const address of addresses) {
                await prisma.address.create({ data: address })
            }
            console.log(`✅ Restored ${addresses.length} addresses`)
        }

        // Restore Orders (with OrderItems)
        const ordersPath = resolve(backupDir, 'orders.json')
        if (existsSync(ordersPath)) {
            console.log('Restoring orders...')
            const orders = JSON.parse(readFileSync(ordersPath, 'utf8'))
            let successCount = 0;
            let errorCount = 0;

            for (const order of orders) {
                const { orderItems, ...orderData } = order

                // Clean up orderItems for nested create (remove redundant orderId)
                const cleanOrderItems = orderItems ? orderItems.map(item => {
                    const { orderId, ...rest } = item
                    return rest
                }) : []

                try {
                    await prisma.order.create({
                        data: {
                            ...orderData,
                            orderItems: {
                                create: cleanOrderItems
                            }
                        }
                    })
                    successCount++;
                } catch (err) {
                    console.error(`❌ Error restoring order ${order.id}:`, err.message)
                    errorCount++;
                }
            }
            console.log(`✅ Restored ${successCount} orders, ❌ Failed ${errorCount} orders`)
        }

        // Restore Ratings
        const ratingsPath = resolve(backupDir, 'ratings.json')
        if (existsSync(ratingsPath)) {
            console.log('Restoring ratings...')
            const ratings = JSON.parse(readFileSync(ratingsPath, 'utf8'))
            for (const rating of ratings) {
                await prisma.rating.create({ data: rating })
            }
            console.log(`✅ Restored ${ratings.length} ratings`)
        }

        // Restore Carts (with CartItems)
        const cartsPath = resolve(backupDir, 'carts.json')
        if (existsSync(cartsPath)) {
            console.log('Restoring carts...')
            const carts = JSON.parse(readFileSync(cartsPath, 'utf8'))
            for (const cart of carts) {
                const { items, ...cartData } = cart
                await prisma.cart.create({
                    data: {
                        ...cartData,
                        items: {
                            create: items
                        }
                    }
                })
            }
            console.log(`✅ Restored ${carts.length} carts`)
        }

        // Restore Wallets (with Transactions)
        const walletsPath = resolve(backupDir, 'wallets.json')
        if (existsSync(walletsPath)) {
            console.log('Restoring wallets...')
            const wallets = JSON.parse(readFileSync(walletsPath, 'utf8'))
            for (const wallet of wallets) {
                const { transactions, ...walletData } = wallet
                await prisma.wallet.create({
                    data: {
                        ...walletData,
                        transactions: {
                            create: transactions
                        }
                    }
                })
            }
            console.log(`✅ Restored ${wallets.length} wallets`)
        }

        // Restore Coupons
        const couponsPath = resolve(backupDir, 'coupons.json')
        if (existsSync(couponsPath)) {
            console.log('Restoring coupons...')
            const coupons = JSON.parse(readFileSync(couponsPath, 'utf8'))
            for (const coupon of coupons) {
                await prisma.coupon.create({ data: coupon })
            }
            console.log(`✅ Restored ${coupons.length} coupons`)
        }

        // Restore Chats (with Messages)
        const chatsPath = resolve(backupDir, 'chats.json')
        if (existsSync(chatsPath)) {
            console.log('Restoring chats...')
            const chats = JSON.parse(readFileSync(chatsPath, 'utf8'))
            for (const chat of chats) {
                const { messages, ...chatData } = chat
                await prisma.chat.create({
                    data: {
                        ...chatData,
                        messages: {
                            create: messages
                        }
                    }
                })
            }
            console.log(`✅ Restored ${chats.length} chats`)
        }

        // Restore Returns
        const returnsPath = resolve(backupDir, 'returns.json')
        if (existsSync(returnsPath)) {
            console.log('Restoring returns...')
            const returns = JSON.parse(readFileSync(returnsPath, 'utf8'))
            for (const returnItem of returns) {
                await prisma.return.create({ data: returnItem })
            }
            console.log(`✅ Restored ${returns.length} returns`)
        }

        // Restore Payout Requests
        const payoutRequestsPath = resolve(backupDir, 'payout-requests.json')
        if (existsSync(payoutRequestsPath)) {
            console.log('Restoring payout requests...')
            const payoutRequests = JSON.parse(readFileSync(payoutRequestsPath, 'utf8'))
            for (const payoutRequest of payoutRequests) {
                await prisma.payoutRequest.create({ data: payoutRequest })
            }
            console.log(`✅ Restored ${payoutRequests.length} payout requests`)
        }

        console.log('\n✅ Database restore completed successfully!')
        console.log('')

    } catch (error) {
        console.error('❌ Error restoring database:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

// Main execution
async function main() {
    const backupFolder = process.argv[2]

    if (!backupFolder) {
        console.log('📁 Available backups:\n')
        const backups = await listBackups()

        if (backups.length === 0) {
            console.log('   No backups found. Run "node scripts/backup-database.js" first.')
        } else {
            backups.forEach((backup, index) => {
                console.log(`   ${index + 1}. ${backup}`)
            })
            console.log('\n💡 Usage: node scripts/restore-database.js [backup-folder-name]')
            console.log(`   Example: node scripts/restore-database.js ${backups[0]}`)
        }
        process.exit(0)
    }

    await restoreDatabase(backupFolder)
}

main()
