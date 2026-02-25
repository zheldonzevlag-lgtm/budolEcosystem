const { PrismaClient } = require('@prisma/client-custom-v4');
const prisma = new PrismaClient();

async function inspect() {
    try {
        // Find the most recent order or specific one
        const order = await prisma.order.findFirst({
            orderBy: { createdAt: 'desc' },
            include: { user: true }
        });

        if (!order) {
            console.log('No orders found.');
            return;
        }

        console.log(`Checking Order ID: ${order.id}`);
        console.log(`Lalamove Booking ID: ${order.shipping?.bookingId}`);
        console.log('--- Current Driver Info in DB ---');
        console.log(JSON.stringify(order.shipping?.driverInfo, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

inspect();
