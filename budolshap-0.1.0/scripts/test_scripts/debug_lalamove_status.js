
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLalamoveOrders() {
    try {
        const orders = await prisma.order.findMany({
            where: {
                paymentMethod: 'GCASH' // Assuming these are the ones with shipping
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                status: true,
                shipping: true
            }
        });

        console.log('--- Recent Lalamove Orders ---');
        for (const order of orders) {
            const shipping = order.shipping;
            if (shipping && shipping.provider === 'lalamove') {
                console.log(`Order ID: ${order.id}`);
                console.log(`Main Status: ${order.status}`);
                console.log(`Shipping Status: ${shipping.status}`);
                console.log(`Share Link: ${shipping.shareLink}`);
                console.log('---------------------------');
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkLalamoveOrders();
