const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Debugging Orders ---');

    // 1. List all users to find "Peter Parker"
    const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true }
    });
    console.log('All Users:', users);

    // 2. List all orders with their user IDs
    const orders = await prisma.order.findMany({
        include: {
            orderItems: true
        }
    });
    console.log('All Orders:', JSON.stringify(orders, null, 2));

    // 3. Check for specific order item if visible in screenshot (optional, but let's see global state first)
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
