const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findOrderByBookingId() {
    try {
        console.log('Searching for order with booking ID: 3379143481582114331\n');

        // Method 1: Using JSON path query
        const order1 = await prisma.order.findFirst({
            where: {
                shipping: {
                    path: ['bookingId'],
                    equals: '3379143481582114331'
                }
            }
        });

        console.log('Method 1 (JSON path query):');
        console.log(order1 ? `✅ Found: ${order1.id}` : '❌ Not found');

        // Method 2: Get all Lalamove orders and check manually
        const allOrders = await prisma.order.findMany({
            where: {
                shipping: {
                    path: ['provider'],
                    equals: 'lalamove'
                }
            },
            select: {
                id: true,
                shipping: true
            }
        });

        console.log(`\nMethod 2 (Manual check of ${allOrders.length} Lalamove orders):`);
        allOrders.forEach(order => {
            const bookingId = order.shipping?.bookingId;
            if (bookingId) {
                console.log(`Order ${order.id}: bookingId = "${bookingId}" (type: ${typeof bookingId})`);
                if (bookingId === '3379141263827092112') {
                    console.log('  ✅ MATCH!');
                }
                if (bookingId === 3379141263827092112) {
                    console.log('  ✅ MATCH (as number)!');
                }
            }
        });

        // Method 3: Check the actual order from earlier
        const specificOrder = await prisma.order.findUnique({
            where: { id: 'cmit4cuag0002jx04sbzql9ox' }
        });

        console.log('\nMethod 3 (Specific order cmit4cuag0002jx04sbzql9ox):');
        if (specificOrder) {
            console.log('Booking ID:', specificOrder.shipping?.bookingId);
            console.log('Type:', typeof specificOrder.shipping?.bookingId);
            console.log('Full shipping object:');
            console.log(JSON.stringify(specificOrder.shipping, null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

findOrderByBookingId();
