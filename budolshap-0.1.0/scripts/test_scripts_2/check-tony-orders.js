const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'tony.stark@budolshap.com' },
        include: { store: true }
    });

    if (!user || !user.store) {
        console.log('User or Store not found');
        return;
    }

    const orders = await prisma.order.findMany({
        where: {
            storeId: user.store.id,
            status: { in: ['DELIVERED', 'COMPLETED', 'RETURN_REQUESTED'] }
        },
        include: { user: true }
    });

    console.log(`Returnable/Requested Orders for ${user.store.name}:`);
    orders.forEach(o => {
        console.log(`ID: ${o.id}, Status: ${o.status}, Buyer: ${o.user.email}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
