import { prisma } from '../../lib/prisma.js';

async function test() {
    try {
        const storeId = 'cmjq9lbwh0001gpe0tj4xfue7';
        const where = { storeId };

        const count = await prisma.order.count({ where });
        console.log(`Prisma count for storeId ${storeId}: ${count}`);

        const orders = await prisma.order.findMany({
            where,
            include: {
                orderItems: true
            }
        });
        console.log(`Prisma findMany for storeId ${storeId}: ${orders.length}`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
