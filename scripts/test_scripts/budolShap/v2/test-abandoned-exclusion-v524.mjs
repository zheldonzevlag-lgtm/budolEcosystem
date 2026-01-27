import { PrismaClient } from '../../../../budolshap-0.1.0/node_modules/@prisma/client/index.js';

const prisma = new PrismaClient();

async function testExclusionRules() {
    console.log('--- Testing Abandoned Payment Exclusion Rules (v524) ---');

    try {
        // 1. Get total orders before exclusion
        const totalOrders = await prisma.order.count();
        console.log(`Total orders in DB: ${totalOrders}`);

        // 2. Test Rule: Exclude cancelled/failed/expired
        const excludedStatuses = ['cancelled', 'failed', 'expired'];
        const excludedByStatusCount = await prisma.order.count({
            where: {
                paymentStatus: { in: excludedStatuses }
            }
        });
        console.log(`Orders with terminal status [${excludedStatuses.join(', ')}]: ${excludedByStatusCount}`);

        // 3. Test Rule: COD orders with awaiting_payment should be KEPT
        const codAwaitingCount = await prisma.order.count({
            where: {
                paymentMethod: 'COD',
                paymentStatus: 'awaiting_payment'
            }
        });
        console.log(`COD orders with awaiting_payment (should be kept): ${codAwaitingCount}`);

        // 4. Test Rule: Non-COD orders with awaiting_payment and > 30 mins old should be EXCLUDED
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        const nonCodStaleAwaitingCount = await prisma.order.count({
            where: {
                paymentStatus: 'awaiting_payment',
                paymentMethod: { not: 'COD' },
                createdAt: { lt: thirtyMinutesAgo }
            }
        });
        console.log(`Non-COD stale awaiting orders (>30 mins, should be excluded): ${nonCodStaleAwaitingCount}`);

        // 5. Simulate the full exclusion query logic from ordersService.js
        // We want to count what IS included by the filter
        const includedCount = await prisma.order.count({
            where: {
                OR: [
                    // 1. Include orders that are not in terminal abandoned statuses AND not awaiting_payment
                    { 
                        AND: [
                            { paymentStatus: { notIn: ['cancelled', 'failed', 'expired', 'awaiting_payment'] } }
                        ]
                    },
                    // 2. Include COD orders even if awaiting payment
                    { 
                        AND: [
                            { paymentMethod: 'COD' },
                            { paymentStatus: 'awaiting_payment' }
                        ]
                    },
                    // 3. Include recent non-COD awaiting_payment orders (less than 30 minutes)
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

        const excludedCount = totalOrders - includedCount;
        console.log(`--- Simulation Result ---`);
        console.log(`Orders that WOULD be included: ${includedCount}`);
        console.log(`Orders that WOULD be excluded: ${excludedCount}`);
        
        // Validation:
        // Total Excluded = (Orders with status in [cancelled, failed, expired]) + (Non-COD orders awaiting_payment and > 30 mins)
        const expectedExcluded = excludedByStatusCount + nonCodStaleAwaitingCount;
        
        console.log(`Expected Excluded (Sum of separate counts): ${expectedExcluded}`);

        // 6. Detailed Investigation
        const allOrders = await prisma.order.findMany({
            select: {
                id: true,
                paymentStatus: true,
                paymentMethod: true,
                createdAt: true
            }
        });

        console.log('\n--- Detailed Order Audit ---');
        allOrders.forEach(o => {
            const isTerminalExcluded = excludedStatuses.includes(o.paymentStatus);
            const isNonCodStaleAwaiting = o.paymentStatus === 'awaiting_payment' && o.paymentMethod !== 'COD' && o.createdAt < thirtyMinutesAgo;
            
            // The filter logic from ordersService.js (Included if ANY of these match)
            const isIncludedByFilter = (
                (!excludedStatuses.includes(o.paymentStatus) && o.paymentStatus !== 'awaiting_payment') || 
                (o.paymentMethod === 'COD' && o.paymentStatus === 'awaiting_payment') ||
                (o.paymentStatus === 'awaiting_payment' && o.paymentMethod !== 'COD' && o.createdAt >= thirtyMinutesAgo)
            );

            console.log(`Order ${o.id}: Status=${o.paymentStatus}, Method=${o.paymentMethod}, Created=${o.createdAt.toISOString()}`);
            console.log(`  - Terminal Excluded: ${isTerminalExcluded}`);
            console.log(`  - Non-COD Stale Awaiting: ${isNonCodStaleAwaiting}`);
            console.log(`  - Result in UI: ${isIncludedByFilter ? 'INCLUDED' : 'EXCLUDED'}`);
        });

        if (excludedCount === expectedExcluded) {
            console.log('\n✅ PASS: Exclusion logic correctly identifies abandoned payments.');
        } else {
            console.log('\n⚠️ WARNING: Exclusion count mismatch. Check for overlapping statuses.');
        }

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testExclusionRules();
