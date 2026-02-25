import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function verifyExclusion() {
    console.log('--- Verifying Order Exclusion Logic (v524) ---');

    // 1. Get total counts
    const totalOrders = await prisma.order.count();
    const failedOrders = await prisma.order.count({ where: { paymentStatus: 'failed' } });
    const expiredOrders = await prisma.order.count({ where: { paymentStatus: 'expired' } });
    const cancelledOrders = await prisma.order.count({ where: { paymentStatus: 'cancelled' } });

    console.log(`Total Orders: ${totalOrders}`);
    console.log(`Failed Orders: ${failedOrders}`);
    console.log(`Expired Orders: ${expiredOrders}`);
    console.log(`Cancelled Orders: ${cancelledOrders}`);

    // 2. Simulate "To Pay" Tab Logic (excludeAbandonedPayments: true)
    // In ordersService.js, this uses:
    // { paymentStatus: { notIn: ['cancelled', 'failed', 'expired', 'awaiting_payment'] } }
    // OR COD + awaiting_payment
    // OR non-COD + awaiting_payment + < 30 mins
    
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const activeOrders = await prisma.order.findMany({
        where: {
            OR: [
                { paymentStatus: { notIn: ['cancelled', 'failed', 'expired', 'awaiting_payment'] } },
                { 
                    AND: [
                        { paymentMethod: 'COD' },
                        { paymentStatus: 'awaiting_payment' }
                    ]
                },
                {
                    AND: [
                        { paymentStatus: 'awaiting_payment' },
                        { paymentMethod: { not: 'COD' } },
                        { createdAt: { gte: thirtyMinutesAgo } }
                    ]
                }
            ]
        }
    });

    console.log(`Active (To Pay) Orders Count: ${activeOrders.length}`);

    // Check if any failed/expired/cancelled are in the active list
    const leaked = activeOrders.filter(o => ['failed', 'expired', 'cancelled'].includes(o.paymentStatus));
    if (leaked.length > 0) {
        console.error('FAIL: Leaked orders found in active list:', leaked.map(o => o.id));
    } else {
        console.log('PASS: No failed/expired/cancelled orders in active list.');
    }

    // 3. Simulate "Cancelled" Tab Logic
    // In ordersService.js, this uses:
    // OR [ { status: 'CANCELLED' }, { paymentStatus: { in: ['cancelled', 'failed', 'expired'] } }, ... ]
    
    const cancelledTabOrders = await prisma.order.findMany({
        where: {
            OR: [
                { status: 'CANCELLED' },
                { paymentStatus: { in: ['cancelled', 'failed', 'expired'] } }
            ]
        }
    });

    console.log(`Cancelled Tab Orders Count: ${cancelledTabOrders.length}`);

    // Verify all failed/expired are here
    const missingFailed = failedOrders > 0 && !cancelledTabOrders.some(o => o.paymentStatus === 'failed');
    const missingExpired = expiredOrders > 0 && !cancelledTabOrders.some(o => o.paymentStatus === 'expired');

    if (missingFailed || missingExpired) {
        console.error('FAIL: Some failed/expired orders are missing from the Cancelled tab.');
    } else {
        console.log('PASS: Failed and expired orders are correctly mapped to the Cancelled tab.');
    }
}

verifyExclusion()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
