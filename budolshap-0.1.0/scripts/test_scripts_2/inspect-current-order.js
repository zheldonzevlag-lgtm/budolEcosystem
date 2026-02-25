const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
    const orderId = 'cmjguow0a000agpoouahn4wis';
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });
        if (!order) {
            console.log('Order not found');
            return;
        }
        console.log('--- Order Shipping JSON ---');
        console.log(JSON.stringify(order.shipping, null, 2));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

inspect();
