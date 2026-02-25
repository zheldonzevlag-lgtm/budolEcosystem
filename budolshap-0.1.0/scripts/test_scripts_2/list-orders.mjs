import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function listOrders() {
    const orders = await prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { returns: true }
    });

    console.log('Orders:', JSON.stringify(orders, null, 2));
}

listOrders().catch(console.error).finally(() => prisma.$disconnect());
