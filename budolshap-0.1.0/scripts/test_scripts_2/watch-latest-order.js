const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Load production environment variables
const envPath = path.join(__dirname, '..', '.env.production');
const envContent = fs.readFileSync(envPath, 'utf-8');
const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);
const DATABASE_URL = dbUrlMatch[1].replace(/\n/g, '');

const prisma = new PrismaClient({
    datasources: { db: { url: DATABASE_URL } }
});

async function main() {
    console.log('🔍 Watching for the latest Lalamove order...\n');

    const order = await prisma.order.findFirst({
        where: {
            shipping: {
                path: ['provider'],
                equals: 'lalamove'
            }
        },
        orderBy: { createdAt: 'desc' },
        include: { user: true, store: true }
    });

    if (!order) {
        console.log('❌ No Lalamove orders found yet.');
        return;
    }

    console.log(`✅ Latest Order Found: ${order.id}`);
    console.log(`   Created At: ${order.createdAt.toLocaleString()}`);
    console.log(`   Customer: ${order.user.name}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Booking ID: ${order.shipping?.bookingId || 'PENDING'}`);

    if (order.shipping?.driver) {
        console.log('\n📋 Driver Info:');
        console.log(JSON.stringify(order.shipping.driver, null, 2));
    } else {
        console.log('\n❌ Driver Info: Not yet assigned');
    }

    console.log(`\n----------------------------------------`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
