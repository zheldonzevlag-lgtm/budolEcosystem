/**
 * Find Test Order for Phase 2 Testing
 * Queries production database to find a suitable order for webhook testing
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findTestOrder() {
    console.log('🔍 Searching for suitable test order in production...\n');

    try {
        // Find a PAID order with Lalamove booking
        const orders = await prisma.order.findMany({
            where: {
                status: 'PAID',
                shipping: {
                    path: ['provider'],
                    equals: 'lalamove'
                }
            },
            include: {
                user: true,
                store: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 5
        });

        if (orders.length === 0) {
            console.log('❌ No suitable orders found.');
            console.log('Looking for orders with any Lalamove booking...\n');

            // Try to find any order with Lalamove
            const anyOrders = await prisma.order.findMany({
                where: {
                    shipping: {
                        path: ['provider'],
                        equals: 'lalamove'
                    }
                },
                include: {
                    user: true,
                    store: true
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 5
            });

            if (anyOrders.length > 0) {
                console.log(`Found ${anyOrders.length} orders with Lalamove:\n`);
                anyOrders.forEach((order, index) => {
                    console.log(`${index + 1}. Order ID: ${order.id}`);
                    console.log(`   Status: ${order.status}`);
                    console.log(`   Booking ID: ${order.shipping?.bookingId || 'N/A'}`);
                    console.log(`   Customer: ${order.user.email}`);
                    console.log(`   Store: ${order.store.name}`);
                    console.log(`   Created: ${order.createdAt}`);
                    console.log('');
                });
            } else {
                console.log('❌ No orders with Lalamove found in database.');
            }

            return;
        }

        console.log(`✅ Found ${orders.length} suitable test orders:\n`);

        orders.forEach((order, index) => {
            console.log(`${index + 1}. Order ID: ${order.id}`);
            console.log(`   Status: ${order.status}`);
            console.log(`   Booking ID: ${order.shipping?.bookingId || 'N/A'}`);
            console.log(`   Customer: ${order.user.email}`);
            console.log(`   Store: ${order.store.name}`);
            console.log(`   Total: ₱${order.total.toLocaleString()}`);
            console.log(`   Created: ${order.createdAt}`);
            console.log('');
        });

        const recommendedOrder = orders[0];
        console.log('📋 RECOMMENDED TEST ORDER:');
        console.log(`   Order ID: ${recommendedOrder.id}`);
        console.log(`   Booking ID: ${recommendedOrder.shipping?.bookingId}\n`);

        console.log('🧪 To run the test, use:');
        console.log(`   node scripts/test-phase2-production.js ${recommendedOrder.shipping?.bookingId} ${recommendedOrder.id}\n`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

findTestOrder();
