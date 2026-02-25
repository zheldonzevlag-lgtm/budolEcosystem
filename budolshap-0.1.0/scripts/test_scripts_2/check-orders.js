const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'stephen.strange@budolshap.com' },
        include: { buyerOrders: { include: { orderItems: true } } }
    });

    if (!user) {
        console.log('User not found');
        return;
    }

    console.log(`Orders for ${user.email}:`);
    user.buyerOrders.forEach(o => {
        console.log(`ID: ${o.id}, Status: ${o.status}, Total: ${o.total}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
