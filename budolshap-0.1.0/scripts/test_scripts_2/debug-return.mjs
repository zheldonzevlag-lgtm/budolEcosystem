import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkOrder() {
    const orderId = 'cmjpivogk0009gp8s6cygvzhw';
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { returns: true }
    });

    console.log('Order:', JSON.stringify(order, null, 2));
}

checkOrder().catch(console.error).finally(() => prisma.$disconnect());
