// Script to manually update driver info for testing
// Usage: node update-driver-info.js <orderId>

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateDriverInfo(orderId) {
    try {
        // Find the order
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            console.error('Order not found:', orderId);
            return;
        }

        console.log('Current shipping data:', JSON.stringify(order.shipping, null, 2));

        // Update with test driver info
        const updatedShipping = {
            ...order.shipping,
            driverInfo: {
                name: "TestDriver 34567",
                phone: "+6310012345627",
                plateNumber: "VP9946964",
                photo: null
            }
        };

        await prisma.order.update({
            where: { id: orderId },
            data: {
                shipping: updatedShipping
            }
        });

        console.log('✅ Driver info updated successfully!');
        console.log('Updated shipping data:', JSON.stringify(updatedShipping, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

const orderId = process.argv[2];
if (!orderId) {
    console.error('Usage: node update-driver-info.js <orderId>');
    process.exit(1);
}

updateDriverInfo(orderId);
