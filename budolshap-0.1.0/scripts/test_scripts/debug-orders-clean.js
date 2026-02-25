const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Debugging Orders (Clean) ---');

    const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true }
    });
    console.log('--- USERS ---');
    users.forEach(u => console.log(`${u.id} | ${u.name} | ${u.email}`));

    const orders = await prisma.order.findMany({
        select: { id: true, userId: true, total: true, status: true }
    });

    console.log('\n--- ORDERS ---');
    orders.forEach(o => console.log(`${o.id} | User: ${o.userId} | Total: ${o.total}`));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
