const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLalamoveOrders() {
    try {
        const orders = await prisma.order.findMany({
            where: {
                shipping: {
                    path: ['provider'],
                    equals: 'lalamove'
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 5,
            select: {
                id: true,
                status: true,
                shipping: true,
                createdAt: true,
                user: {
                    select: {
                        email: true
                    }
                }
            }
        });

        console.log('\n=== LALAMOVE ORDERS ===\n');
        console.log(`Found ${orders.length} Lalamove orders\n`);

        orders.forEach((order, index) => {
            console.log(`\n--- Order ${index + 1} ---`);
            console.log(`ID: ${order.id}`);
            console.log(`Status: ${order.status}`);
            console.log(`User: ${order.user.email}`);
            console.log(`Created: ${order.createdAt}`);
            console.log(`Lalamove Status: ${order.shipping?.status || 'N/A'}`);
            console.log(`Booking ID: ${order.shipping?.bookingId || 'N/A'}`);
            console.log(`Share Link: ${order.shipping?.shareLink ? 'Yes' : 'No'}`);

            if (order.shipping?.driver) {
                console.log('\n  Driver Info:');
                console.log(`  - Name: ${order.shipping.driver.name}`);
                console.log(`  - Phone: ${order.shipping.driver.phone}`);
                console.log(`  - Vehicle: ${order.shipping.driver.vehicleType || 'N/A'}`);
                console.log(`  - Plate: ${order.shipping.driver.plateNumber || 'N/A'}`);
                console.log(`  - Rating: ${order.shipping.driver.rating || 'N/A'}`);
            } else {
                console.log('\n  Driver Info: Not assigned yet');
            }

            if (order.shipping?.location) {
                console.log('\n  Location:');
                console.log(`  - Lat: ${order.shipping.location.lat}`);
                console.log(`  - Lng: ${order.shipping.location.lng}`);
                console.log(`  - Updated: ${order.shipping.location.updatedAt || 'N/A'}`);
            }

            if (order.shipping?.estimatedDeliveryTime) {
                console.log(`\n  ETA: ${order.shipping.estimatedDeliveryTime}`);
            }
        });

        console.log('\n======================\n');

        if (orders.length > 0) {
            console.log(`\nTo test the UI, visit:`);
            console.log(`http://localhost:3000/orders/${orders[0].id}`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkLalamoveOrders();
