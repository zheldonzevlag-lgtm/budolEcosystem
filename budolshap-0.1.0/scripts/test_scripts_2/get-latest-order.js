const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const order = await prisma.order.findFirst({
        orderBy: { createdAt: 'desc' }
    });
    if (order) {
        console.log('Latest Order ID:', order.id);
    } else {
        console.log('No orders found');
    }
    await prisma.$disconnect();
}

main().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
