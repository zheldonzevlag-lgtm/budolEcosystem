const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
    try {
        const orders = await prisma.order.findMany({
            take: 20,
            orderBy: { createdAt: 'desc' }
        });

        const summary = orders.map(o => ({
            id: o.id,
            total: o.total,
            status: o.status,
            bookingId: o.shipping?.bookingId,
            shippingKeys: o.shipping ? Object.keys(o.shipping) : null
        }));

        fs.writeFileSync('orders_debug.json', JSON.stringify(summary, null, 2));
        console.log('Dumped 20 latest orders to orders_debug.json');
    } catch (e) {
        console.error(e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
