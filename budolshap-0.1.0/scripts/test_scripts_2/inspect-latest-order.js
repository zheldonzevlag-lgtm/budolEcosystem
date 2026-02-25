const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
    const latestOrder = await prisma.order.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { user: true }
    });

    if (!latestOrder) {
        console.log('No orders found.');
        return;
    }

    console.log('--- Latest Order ---');
    console.log('ID:', latestOrder.id);
    console.log('Status:', latestOrder.status);
    console.log('Shipping Provider:', latestOrder.shipping?.provider);
    console.log('Shipping Booking ID:', latestOrder.shipping?.bookingId);
    console.log('Shipping Status:', latestOrder.shipping?.status);
    console.log('Full Shipping Object:', JSON.stringify(latestOrder.shipping, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
