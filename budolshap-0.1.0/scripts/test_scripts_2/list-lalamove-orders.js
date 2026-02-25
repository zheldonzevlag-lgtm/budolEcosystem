const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
    try {
        const orders = await prisma.order.findMany({
            where: {
                shipping: {
                    path: ['provider'],
                    equals: 'lalamove'
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 5
        });

        console.log(`Found ${orders.length} Lalamove orders:`);
        orders.forEach(o => {
            console.log(`\nID: ${o.id}`);
            console.log(`Status: ${o.status}`);
            console.log(`Shipping Status: ${o.shipping?.status}`);
            console.log(`Driver Info:`, JSON.stringify(o.shipping?.driverInfo, null, 2));
            console.log(`Driver (Legacy):`, JSON.stringify(o.shipping?.driver, null, 2));
        });
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

inspect();
