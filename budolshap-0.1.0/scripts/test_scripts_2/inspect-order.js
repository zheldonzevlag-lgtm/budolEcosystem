const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugOrder() {
    const orderId = 'cmjgom17a0003gpjg8a4t1uws';
    const order = await prisma.order.findUnique({
        where: { id: orderId }
    });

    if (!order) {
        console.log('Order not found');
        return;
    }

    console.log('--- Order Shipping Detail ---');
    console.log(JSON.stringify(order.shipping, null, 2));
    process.exit(0);
}

debugOrder().catch(err => {
    console.error(err);
    process.exit(1);
});
