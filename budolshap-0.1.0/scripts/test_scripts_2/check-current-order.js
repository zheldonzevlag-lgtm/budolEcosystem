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
    const orderId = 'cmiribjt20004lc04bcmpiscm';

    const order = await prisma.order.findUnique({
        where: { id: orderId }
    });

    if (!order) {
        console.log('❌ Order not found');
        return;
    }

    const output = {
        orderId: order.id,
        status: order.status,
        bookingId: order.shipping?.bookingId,
        hasDriver: !!order.shipping?.driver,
        driverData: order.shipping?.driver || null,
        fullShipping: order.shipping
    };

    // Save to file
    fs.writeFileSync(
        path.join(__dirname, 'order-shipping-data.json'),
        JSON.stringify(output, null, 2)
    );

    console.log('Order ID:', order.id);
    console.log('Status:', order.status);
    console.log('Booking ID:', order.shipping?.bookingId);
    console.log('Has Driver Data:', !!order.shipping?.driver);

    if (order.shipping?.driver) {
        console.log('\n✅ Driver Info:');
        console.log(JSON.stringify(order.shipping.driver, null, 2));
    } else {
        console.log('\n❌ No driver data in database');
    }

    console.log('\n📄 Full data saved to: scripts/order-shipping-data.json');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
