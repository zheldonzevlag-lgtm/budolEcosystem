const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const orderId = 'cmikk91l7000411sr5967dqui';
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { store: true }
    });

    if (order) {
        console.log('Store Contact:', order.store.contact);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
