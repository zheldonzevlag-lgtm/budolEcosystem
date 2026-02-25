const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrderDriverData() {
    try {
        console.log('Checking order driver data...\n');

        // Find order by Lalamove booking ID
        const order = await prisma.order.findFirst({
            where: {
                shipping: {
                    path: ['bookingId'],
                    equals: '3379141263827092112'
                }
            },
            select: {
                id: true,
                status: true,
                shipping: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!order) {
            console.log('❌ Order not found with booking ID: 3379141263827092112');

            // Try to find any recent Lalamove orders
            console.log('\nSearching for recent Lalamove orders...\n');
            const recentOrders = await prisma.order.findMany({
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
                take: 5
            });

            console.log(`Found ${recentOrders.length} recent Lalamove orders:\n`);
            recentOrders.forEach((o, i) => {
                console.log(`${i + 1}. Order ID: ${o.id}`);
                console.log(`   Status: ${o.status}`);
                console.log(`   Booking ID: ${o.shipping?.bookingId || 'N/A'}`);
                console.log(`   Has Driver: ${o.shipping?.driver ? 'YES ✅' : 'NO ❌'}`);
                if (o.shipping?.driver) {
                    console.log(`   Driver Name: ${o.shipping.driver.name}`);
                    console.log(`   Driver Phone: ${o.shipping.driver.phone}`);
                }
                console.log(`   Created: ${o.createdAt}`);
                console.log('');
            });
        } else {
            console.log('✅ Order found!');
            console.log(`Order ID: ${order.id}`);
            console.log(`Status: ${order.status}`);
            console.log(`Created: ${order.createdAt}`);
            console.log(`Updated: ${order.updatedAt}`);
            console.log('\nShipping Data:');
            console.log(JSON.stringify(order.shipping, null, 2));

            if (order.shipping?.driver) {
                console.log('\n✅ Driver information EXISTS in database:');
                console.log(`   Name: ${order.shipping.driver.name}`);
                console.log(`   Phone: ${order.shipping.driver.phone}`);
                console.log(`   Plate: ${order.shipping.driver.plateNumber}`);
                console.log(`   Vehicle: ${order.shipping.driver.vehicleType}`);
            } else {
                console.log('\n❌ NO driver information in database!');
                console.log('   This means the webhook did not save the driver data.');
            }

            if (order.shipping?.location) {
                console.log('\n✅ Location information EXISTS:');
                console.log(`   Lat: ${order.shipping.location.lat}`);
                console.log(`   Lng: ${order.shipping.location.lng}`);
            } else {
                console.log('\n❌ NO location information in database!');
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkOrderDriverData();
