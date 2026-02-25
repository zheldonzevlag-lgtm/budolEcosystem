const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
    const orderId = 'cmjh84eln0011gpeg87d02i7c';
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });
        if (!order) {
            console.log('Order not found');
            return;
        }
        console.log('--- Order Details ---');
        console.log('ID:', order.id);
        console.log('Status:', order.status);
        console.log('Shipping Provider:', order.shipping?.provider);
        console.log('Booking ID:', order.shipping?.bookingId);
        console.log('Driver Info:', JSON.stringify(order.shipping?.driverInfo, null, 2));
        console.log('Driver (Legacy):', JSON.stringify(order.shipping?.driver, null, 2));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

inspect();
