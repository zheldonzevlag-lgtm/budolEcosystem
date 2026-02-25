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
    const orderId = 'cmirjyrtl0002jl04lzlwbl0b';

    const order = await prisma.order.findUnique({
        where: { id: orderId }
    });

    if (!order) {
        console.log('❌ Order not found');
        return;
    }

    console.log('Order ID:', order.id);
    console.log('Status:', order.status);
    console.log('Shipped At:', order.shippedAt);
    console.log('Delivered At:', order.deliveredAt);
    console.log('\nLalamove Status:', order.shipping?.status);
    console.log('Has Driver:', !!order.shipping?.driver);

    if (order.shipping?.driver) {
        console.log('\n✅ DRIVER INFO:');
        console.log(JSON.stringify(order.shipping.driver, null, 2));
    } else {
        console.log('\n❌ No driver info in database');
    }

    console.log('\n📄 Order URL: https://budolshap.vercel.app/orders/' + order.id);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
