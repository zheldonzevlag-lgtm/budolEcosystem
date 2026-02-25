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
    const orderId = 'cmirquhpe0002jm04hqnlrbrp'; // Today's test order

    const order = await prisma.order.findUnique({
        where: { id: orderId }
    });

    if (!order) {
        console.log('❌ Order not found');
        return;
    }

    fs.writeFileSync(
        path.join(__dirname, 'ultimate-test-data.json'),
        JSON.stringify(order.shipping, null, 2)
    );

    console.log('✅ Data saved to scripts/ultimate-test-data.json');
    console.log('\n📊 Quick Summary:');
    console.log('Status:', order.shipping?.status);
    console.log('Has Driver:', !!order.shipping?.driver);
    console.log('Has Timeline:', !!order.shipping?.timeline);
    if (order.shipping?.driver) {
        console.log('Driver Name:', order.shipping.driver.name);
        console.log('Driver Phone:', order.shipping.driver.phone);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
