require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Searching for Order with bookingId: 3390733014496927927');

    try {
        const orders = await prisma.order.findMany();
        const order = orders.find(o => o.shipping && o.shipping.bookingId === '3390733014496927927');

        if (!order) {
            console.log('Order not found in database.');
            return;
        }

        console.log('Found order:', order.id);

        const shipping = { ...order.shipping };
        const driverData = {
            name: "Test Driver 34567",
            phone: "+631001234567",
            plateNumber: "VP9946964",
            vehicleType: "VAN",
            photo: null
        };

        // Standardize both keys
        shipping.driverInfo = driverData;
        shipping.driver = driverData;

        await prisma.order.update({
            where: { id: order.id },
            data: { shipping }
        });

        console.log('✅ Updated order successfully with driverInfo!');
    } catch (error) {
        console.error('❌ Error fixing order:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
