const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testOrdersAPI() {
    console.log('=== Testing Orders API Logic ===\n');

    // Find Peter Parker
    const peter = await prisma.user.findFirst({
        where: { email: 'peter.parker@budolshap.com' }
    });

    if (!peter) {
        console.log('ERROR: Peter Parker not found!');
        return;
    }

    console.log('Peter Parker User:');
    console.log(`  ID: ${peter.id}`);
    console.log(`  Name: ${peter.name}`);
    console.log(`  Email: ${peter.email}\n`);

    // Simulate the API call with Peter's ID
    const where = { userId: peter.id };
    const page = 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const [orders, total] = await prisma.$transaction([
        prisma.order.findMany({
            where,
            skip,
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                store: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                address: true,
                orderItems: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                images: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        }),
        prisma.order.count({ where })
    ]);

    console.log(`Orders found for Peter Parker: ${total}`);
    console.log(`Orders returned: ${orders.length}\n`);

    if (orders.length > 0) {
        orders.forEach((order, idx) => {
            console.log(`Order ${idx + 1}:`);
            console.log(`  ID: ${order.id}`);
            console.log(`  Total: ₱${order.total}`);
            console.log(`  Status: ${order.status}`);
            console.log(`  Items: ${order.orderItems.length}`);
            console.log('');
        });
    } else {
        console.log('No orders found - this is the problem!\n');

        // Check if orders exist but with different userId
        const allOrders = await prisma.order.findMany({
            include: { user: true }
        });
        console.log('All orders in database:');
        allOrders.forEach(o => {
            console.log(`  Order ${o.id} -> User: ${o.user.name} (${o.userId})`);
        });
    }
}

testOrdersAPI()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
