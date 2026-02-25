const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const orderId = 'cmikk91l7000411sr5967dqui';
    console.log(`Fetching order: ${orderId}`);

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            store: true
        }
    });

    if (!order) {
        console.log('Order not found');
        return;
    }

    console.log('Order Store:', {
        name: order.store.name,
        address: order.store.address,
        latitude: order.store.latitude,
        longitude: order.store.longitude,
        contact: order.store.contact
    });

    console.log('Stored Shipping:', JSON.stringify(order.shipping, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
