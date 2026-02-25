const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLalamoveOrders() {
    try {
        console.log('🔍 Checking Lalamove orders...\n');

        // Find all orders with Lalamove shipping
        const orders = await prisma.order.findMany({
            where: {
                shipping: {
                    path: ['provider'],
                    equals: 'lalamove'
                }
            },
            select: {
                id: true,
                status: true,
                shipping: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 10
        });

        console.log(`Found ${orders.length} Lalamove orders:\n`);

        orders.forEach((order, index) => {
            console.log(`\n--- Order ${index + 1} ---`);
            console.log(`Order ID: ${order.id}`);
            console.log(`Status: ${order.status}`);
            console.log(`Created: ${order.createdAt}`);
            console.log(`\nShipping Data:`);
            console.log(`  Provider: ${order.shipping?.provider}`);
            console.log(`  Booking ID: ${order.shipping?.bookingId || 'NOT SET'}`);
            console.log(`  Status: ${order.shipping?.status}`);
            console.log(`  Driver Info: ${order.shipping?.driverInfo ? JSON.stringify(order.shipping.driverInfo, null, 2) : 'NOT SET'}`);
            console.log(`  Share Link: ${order.shipping?.shareLink || 'NOT SET'}`);
            console.log(`\nFull shipping object:`);
            console.log(JSON.stringify(order.shipping, null, 2));
        });

        console.log('\n\n✅ Check complete!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkLalamoveOrders();
