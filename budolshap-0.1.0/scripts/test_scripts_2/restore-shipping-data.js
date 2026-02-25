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

    console.log('🛠️ Restoring shipping data for order:', orderId);

    // Reconstruct the shipping object
    const shippingData = {
        provider: 'lalamove',
        serviceType: 'MOTORCYCLE',
        bookingId: '3378367340558635212',
        status: 'COMPLETED',
        driver: {
            name: 'TestDriver 34567',
            phone: '+631001234567',
            plateNumber: 'ABC1234',
            vehicleType: 'MOTORCYCLE'
        },
        // Adding dummy tracking URL as it's required by some UI components
        trackingUrl: 'https://share.sandbox.lalamove.com/tracking?orderId=3378367340558635212&lang=en_PH',
        updatedAt: new Date().toISOString()
    };

    const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
            shipping: shippingData
        }
    });

    console.log('\n✅ Shipping data restored!');
    console.log(JSON.stringify(updatedOrder.shipping, null, 2));
    console.log('\n📄 Check the order page again: https://budolshap.vercel.app/orders/' + orderId);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
