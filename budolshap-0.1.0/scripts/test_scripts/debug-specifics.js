const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Debugging Specifics ---');

    // Search for Peter Parker
    const peter = await prisma.user.findMany({
        where: { name: { contains: 'Parker' } }
    });
    console.log('Peter Parker Users:', JSON.stringify(peter, null, 2));

    // Search for the Order in screenshot
    // The screenshot showed an OrderItem with orderId 'cmitt3irr000il404387txtwu'
    const targetOrderId = 'cmitt3irr000il404387txtwu';
    const order = await prisma.order.findUnique({
        where: { id: targetOrderId },
        include: { user: true }
    });

    if (order) {
        console.log(`Order ${targetOrderId} found!`);
        console.log(`Owned by User: ${order.user.name} (${order.userId})`);
    } else {
        console.log(`Order ${targetOrderId} NOT found directly.`);
        // Search OrderItems
        const item = await prisma.orderItem.findFirst({
            where: { orderId: targetOrderId }
        });
        if (item) {
            console.log(`OrderItem found for ${targetOrderId}, but Order missing??`);
        } else {
            console.log(`No traces of order ${targetOrderId}`);
        }
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
