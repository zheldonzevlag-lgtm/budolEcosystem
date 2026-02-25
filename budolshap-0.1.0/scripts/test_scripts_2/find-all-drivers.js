require('dotenv').config({ path: '.env.production' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findAllDrivers() {
    try {
        const orders = await prisma.order.findMany({
            where: {
                shipping: {
                    not: PrismaClient.JsonNull
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
            take: 20
        });

        // Filter orders that have driver info
        const ordersWithDrivers = orders.filter(order => order.shipping?.driver);

        console.log(`\nFound ${ordersWithDrivers.length} orders with driver info:\n`);

        ordersWithDrivers.forEach((order, index) => {
            console.log(`${index + 1}. Order ID: ${order.id}`);
            console.log(`   Status: ${order.status}`);
            console.log(`   Created: ${order.createdAt.toLocaleString()}`);

            if (order.shipping?.driver) {
                console.log(`   Driver Name: ${order.shipping.driver.name}`);
                console.log(`   Driver ID: ${order.shipping.driver.driverId || 'N/A'}`);
                console.log(`   Phone: ${order.shipping.driver.phone}`);
                console.log(`   Vehicle: ${order.shipping.driver.vehicleType}`);
                console.log(`   Rating: ${order.shipping.driver.rating ? '⭐ ' + order.shipping.driver.rating : 'N/A'}`);
            }
            console.log('');
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

findAllDrivers();
