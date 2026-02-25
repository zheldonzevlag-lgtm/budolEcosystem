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
    const bookingId = '3378364575488890072'; // From screenshot
    console.log(`🔍 Checking order with Booking ID: ${bookingId}...\n`);

    const order = await prisma.order.findFirst({
        where: {
            shipping: {
                path: ['bookingId'],
                equals: bookingId
            }
        }
    });

    if (!order) {
        console.log('❌ Order not found in database');
        return;
    }

    console.log(`✅ Found order: ${order.id}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Last Event: ${order.shipping?.lastEvent}`);

    if (order.shipping?.driver) {
        console.log('\n✅ HAS DRIVER INFO:');
        console.log(JSON.stringify(order.shipping.driver, null, 2));
    } else {
        console.log('\n❌ NO DRIVER INFO in database');
    }

    if (order.shipping?.timeline) {
        console.log('\n📋 Timeline:');
        console.log(JSON.stringify(order.shipping.timeline, null, 2));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
