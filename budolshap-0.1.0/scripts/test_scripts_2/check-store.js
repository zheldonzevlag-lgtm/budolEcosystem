const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const orderId = 'cmikk91l7000411sr5967dqui';
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { store: true }
    });

    if (order) {
        console.log('Store Name Length:', order.store.name.length);
        console.log('Store Name:', order.store.name);
        console.log('Lat:', order.store.latitude);
        console.log('Lng:', order.store.longitude);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
