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
    // Find the most recent order with Lalamove
    const order = await prisma.order.findFirst({
        where: {
            shipping: {
                path: ['provider'],
                equals: 'lalamove'
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    if (!order) {
        console.log('No Lalamove orders found');
        return;
    }

    console.log('Order ID:', order.id);
    console.log('Status:', order.status);
    console.log('Booking ID:', order.shipping?.bookingId);
    console.log('\n=== DRIVER INFORMATION ===');

    if (order.shipping?.driver) {
        console.log('Driver found in database:');
        console.log(JSON.stringify(order.shipping.driver, null, 2));
    } else {
        console.log('❌ No driver information in database');
        console.log('\nThis means the ON_GOING webhook has not been received or processed yet.');
    }

    console.log('\n=== TIMELINE ===');
    if (order.shipping?.timeline) {
        console.log(JSON.stringify(order.shipping.timeline, null, 2));
    } else {
        console.log('No timeline data');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
