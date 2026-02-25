require('dotenv').config({ path: '.env.production' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanDriverData() {
    try {
        console.log('Starting driver data cleanup...');

        // Find all orders with shipping data
        const orders = await prisma.order.findMany({
            where: {
                shipping: {
                    not: PrismaClient.JsonNull
                }
            }
        });

        console.log(`Found ${orders.length} orders with shipping data.`);

        let updatedCount = 0;

        for (const order of orders) {
            if (!order.shipping) continue;

            const shipping = order.shipping;
            let hasChange = false;

            // Check for 'driver' field
            if (shipping.driver) {
                delete shipping.driver;
                hasChange = true;
            }

            // Check for 'driverInfo' field
            if (shipping.driverInfo) {
                delete shipping.driverInfo;
                hasChange = true;
            }

            // Check for 'driverLocation' or similar if it exists
            if (shipping.driverLocation) {
                delete shipping.driverLocation;
                hasChange = true;
            }

            // Also reset tracking URL if it was a hardcoded test one? 
            // User only asked to clean "driver information", so keeping trackingUrl is safer unless it's specific to the driver.

            if (hasChange) {
                await prisma.order.update({
                    where: { id: order.id },
                    data: { shipping: shipping }
                });
                updatedCount++;
                console.log(`Cleaned driver data for order ${order.id}`);
            }
        }

        console.log(`Cleanup complete. Updated ${updatedCount} orders.`);

    } catch (error) {
        console.error('Error cleaning driver data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanDriverData();
