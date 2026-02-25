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
    const bookingId = '3378367340558635349';

    const order = await prisma.order.findFirst({
        where: {
            shipping: {
                path: ['bookingId'],
                equals: bookingId
            }
        }
    });

    if (!order) {
        console.log('❌ Order not found with booking ID:', bookingId);
        return;
    }

    const output = {
        orderId: order.id,
        status: order.status,
        lalamoveStatus: order.shipping?.status,
        hasDriver: !!order.shipping?.driver,
        driverData: order.shipping?.driver || null,
        fullShipping: order.shipping
    };

    // Save to file
    fs.writeFileSync(
        path.join(__dirname, 'current-order-data.json'),
        JSON.stringify(output, null, 2)
    );

    console.log('Order ID:', order.id);
    console.log('Status:', order.status);
    console.log('Lalamove Status:', order.shipping?.status);
    console.log('Has Driver:', !!order.shipping?.driver);

    if (order.shipping?.driver) {
        console.log('\n✅ DRIVER INFO FOUND:');
        console.log(JSON.stringify(order.shipping.driver, null, 2));
    } else {
        console.log('\n❌ No driver info in database');
    }

    console.log('\n📄 Data saved to: scripts/current-order-data.json');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
