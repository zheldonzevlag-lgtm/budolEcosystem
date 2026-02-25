const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
    const orderId = 'cmjgu8rag0007gpoopm5f9sya';
    const order = await prisma.order.findUnique({
        where: { id: orderId }
    });
    console.log(JSON.stringify(order.shipping, null, 2));
    process.exit(0);
}

inspect();
