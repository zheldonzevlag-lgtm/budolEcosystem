const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkUserOrders() {
    const email = process.argv[2];

    if (!email) {
        console.log('Please provide an email address to check.');
        console.log('Usage: node scripts/check-user-orders.js <email>');
        process.exit(1);
    }

    console.log(`Checking orders for user with email: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email: email }
    });

    if (!user) {
        console.log('❌ User not found!');
        process.exit(1);
    }

    console.log(`✅ User found: ${user.name} (ID: ${user.id})`);

    const orders = await prisma.order.findMany({
        where: { userId: user.id },
        include: {
            store: { select: { name: true } }
        }
    });

    console.log(`Found ${orders.length} orders for this user.`);

    if (orders.length > 0) {
        orders.forEach(order => {
            console.log(`- Order #${order.id}: ${order.status} (Store: ${order.store.name})`);
        });
    } else {
        console.log('⚠️  This user has no orders in the database.');

        // Check if there are ANY orders in the DB
        const totalOrders = await prisma.order.count();
        console.log(`\n(Total orders in database: ${totalOrders})`);

        if (totalOrders > 0) {
            console.log('There are orders in the DB, but they belong to other users.');
            const sampleOrder = await prisma.order.findFirst();
            console.log(`Sample order ID: ${sampleOrder.id} belongs to User ID: ${sampleOrder.userId}`);
        }
    }
}

checkUserOrders()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
