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
    console.log('🔍 Checking all Lalamove orders...\n');

    const orders = await prisma.order.findMany({
        where: {
            shipping: {
                path: ['provider'],
                equals: 'lalamove'
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    if (orders.length === 0) {
        console.log('❌ No Lalamove orders found');
        return;
    }

    console.log(`Found ${orders.length} Lalamove order(s):\n`);

    for (const order of orders) {
        console.log('─'.repeat(60));
        console.log(`Order ID: ${order.id}`);
        console.log(`Status: ${order.status}`);
        console.log(`Created: ${order.createdAt}`);
        console.log(`Booking ID: ${order.shipping?.bookingId}`);

        if (order.shipping?.driver) {
            console.log('\n✅ HAS DRIVER INFO:');
            console.log(`  Name: ${order.shipping.driver.name}`);
            console.log(`  Phone: ${order.shipping.driver.phone}`);
            console.log(`  Plate: ${order.shipping.driver.plateNumber}`);
            console.log(`  Vehicle: ${order.shipping.driver.vehicleType || 'Not specified'}`);
        } else {
            console.log('\n❌ NO DRIVER INFO');
        }

        if (order.shipping?.timeline && order.shipping.timeline.length > 0) {
            console.log('\n📋 Timeline:');
            order.shipping.timeline.forEach((event, i) => {
                console.log(`  ${i + 1}. ${event.event} - ${event.status} (${event.timestamp})`);
            });
        }
        console.log('');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
