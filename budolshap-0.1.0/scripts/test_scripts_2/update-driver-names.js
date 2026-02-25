require('dotenv').config({ path: '.env.production' });
const { PrismaClient } = require('@prisma/client-custom-v4');
const prisma = new PrismaClient();

async function updateDriverNames() {
    try {
        console.log('Updating driver names in database...\n');

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

            // Check if driver name is in the format "Driver #[ID]"
            if (driver.name && driver.name.startsWith('Driver #')) {
                const updatedShipping = {
                    ...order.shipping,
                    driver: {
                        ...driver,
                        name: 'Lalamove Driver'  // Update to generic name
                    }
                };

                await prisma.order.update({
                    where: { id: order.id },
                    data: { shipping: updatedShipping }
                });

                console.log(`✅ Updated order ${order.id}: "${driver.name}" → "Lalamove Driver"`);
                updatedCount++;
            }
        }

        console.log(`\n✅ Update complete! Updated ${updatedCount} orders.`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateDriverNames();
