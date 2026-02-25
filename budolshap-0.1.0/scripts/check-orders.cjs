const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const orderCount = await prisma.order.count();
        console.log(`Total orders: ${orderCount}`);
        
        if (orderCount > 0) {
            const latestOrders = await prisma.order.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { name: true, email: true }
                    }
                }
            });
            console.log('Latest 5 orders:', JSON.stringify(latestOrders, null, 2));
        } else {
            console.log('No orders found in the database.');
        }
    } catch (error) {
        console.error('Error fetching orders:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
