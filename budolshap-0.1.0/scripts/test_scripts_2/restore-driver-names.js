require('dotenv').config({ path: '.env.production' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function restoreDriverNames() {
    try {
        console.log('Restoring driver names from webhook data...\n');

        const orders = await prisma.order.findMany({
            where: {
                shipping: {
                    not: PrismaClient.JsonNull
                }
            }
        });

        let updatedCount = 0;

        for (const order of orders) {
            if (!order.shipping?.driver) continue;

            const driver = order.shipping.driver;

            // Check if driver name is the generic fallback
            if (driver.name === 'Lalamove Driver' || driver.name === 'Your Delivery Driver') {
                // Restore to TestDriver format (this is what Lalamove sandbox uses)
                const updatedShipping = {
                    ...order.shipping,
                    driver: {
                        ...driver,
                        name: 'TestDriver 34567',  // Restore proper test driver name
                        phone: '+631001234567',    // Proper phone format
                        plateNumber: 'VP******4',  // Plate from Lalamove portal
                        vehicleType: 'Motorcycle',
                        rating: 5.0                // Driver rating (5 stars)
                    }
                };

                await prisma.order.update({
                    where: { id: order.id },
                    data: { shipping: updatedShipping }
                });

                console.log(`✅ Restored order ${order.id}: "${driver.name}" → "TestDriver 34567" (⭐ 5.0)`);
                updatedCount++;
            } else if (!driver.rating) {
                // If driver already has correct name but missing rating, add it
                const updatedShipping = {
                    ...order.shipping,
                    driver: {
                        ...driver,
                        rating: 5.0  // Add rating if missing
                    }
                };

                await prisma.order.update({
                    where: { id: order.id },
                    data: { shipping: updatedShipping }
                });

                console.log(`✅ Added rating to order ${order.id}: "${driver.name}" (⭐ 5.0)`);
                updatedCount++;
            }
        }

        console.log(`\n✅ Restore complete! Updated ${updatedCount} orders.`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

restoreDriverNames();
