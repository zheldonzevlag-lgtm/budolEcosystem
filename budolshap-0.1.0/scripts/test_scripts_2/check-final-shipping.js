const { PrismaClient } = require('@prisma/client-custom-v4');
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
    const orderId = 'cmiro9sjo0002l5047ztowwml';

    const order = await prisma.order.findUnique({
        where: { id: orderId }
    });

    if (!order) {
        console.log('❌ Order not found');
        return;
    }

    fs.writeFileSync(
        path.join(__dirname, 'final-order-data.json'),
        JSON.stringify(order.shipping, null, 2)
    );

    console.log('Data saved to scripts/final-order-data.json');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
