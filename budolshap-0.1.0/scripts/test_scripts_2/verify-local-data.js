
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Verifying database records...')
    try {
        const counts = {
            users: await prisma.user.count(),
            stores: await prisma.store.count(),
            products: await prisma.product.count(),
            orders: await prisma.order.count(),
            transactions: await prisma.transaction.count(),
            wallets: await prisma.wallet.count(),
        }

        console.log('📊 Record Counts:')
        console.table(counts)

        if (Object.values(counts).every(c => c === 0)) {
            console.log('❌ DATABASE IS EMPTY')
        } else {
            console.log('✅ Data detected in database')
        }

    } catch (error) {
        console.error('❌ Error querying database:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
