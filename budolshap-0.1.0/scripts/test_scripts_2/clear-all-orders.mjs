import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function clearOrders() {
    try {
        console.log('🧹 Preparing to clear all order-related data...');

        // 1. Delete Returns
        const returnsCount = await prisma.return.count();
        await prisma.return.deleteMany();
        console.log(`✅ Deleted ${returnsCount} returns.`);

        // 2. Delete Order Items (Note: Cascade might handle this, but being explicit is safer)
        const orderItemsCount = await prisma.orderItem.count();
        await prisma.orderItem.deleteMany();
        console.log(`✅ Deleted ${orderItemsCount} order items.`);

        // 3. Delete Payment Proofs
        const proofsCount = await prisma.paymentProof.count();
        await prisma.paymentProof.deleteMany();
        console.log(`✅ Deleted ${proofsCount} payment proofs.`);

        // 4. Delete Transactions
        const txCount = await prisma.transaction.count();
        await prisma.transaction.deleteMany();
        console.log(`✅ Deleted ${txCount} wallet transactions.`);

        // 5. Delete Orders
        const ordersCount = await prisma.order.count();
        await prisma.order.deleteMany();
        console.log(`✅ Deleted ${ordersCount} orders.`);

        // 6. Reset Wallets to 0
        const walletsCount = await prisma.wallet.updateMany({
            data: {
                balance: 0,
                pendingBalance: 0,
                lockedBalance: 0
            }
        });
        console.log(`✅ Reset ${walletsCount.count} wallets to zero.`);

        // 7. Clear Audit Logs related to orders (optional but good for clean slate)
        const auditCount = await prisma.auditLog.deleteMany({
            where: {
                action: {
                    contains: 'ORDER'
                }
            }
        });
        console.log(`✅ Deleted ${auditCount.count} order-related audit logs.`);

        console.log('\n✨ Database is now clean of all order records. You can start with a fresh slate.');

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

clearOrders();
