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
        console.log('❌ No Lalamove order found');
        return;
    }

    console.log(`Order ID: ${order.id}`);
    console.log(`Booking ID: ${order.shipping?.bookingId || 'PENDING'}`);
    console.log(`Status: ${order.status}`);
    console.log(`Created: ${order.createdAt}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
