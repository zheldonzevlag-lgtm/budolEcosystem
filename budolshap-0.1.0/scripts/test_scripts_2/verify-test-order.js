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
    const orderId = 'cmirn5nie0002js04k29n3fxy';

    const order = await prisma.order.findUnique({
        where: { id: orderId }
    });

    if (!order) {
        console.log('❌ Order not found');
        return;
    }

    // Save to file
    fs.writeFileSync(
        path.join(__dirname, 'test-order-data.json'),
        JSON.stringify({
            orderId: order.id,
            status: order.status,
            paymentStatus: order.paymentStatus,
            paidAt: order.paidAt,
            shipping: order.shipping
        }, null, 2)
    );

    console.log('Order ID:', order.id);
    console.log('Status:', order.status);
    console.log('Payment Status:', order.paymentStatus);
    console.log('Paid At:', order.paidAt);
    console.log('\nBooking ID:', order.shipping?.bookingId || 'NOT CREATED');
    console.log('Lalamove Status:', order.shipping?.status || 'N/A');
    console.log('Has Driver:', !!order.shipping?.driver);

    console.log('\n📄 Data saved to: scripts/test-order-data.json');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
