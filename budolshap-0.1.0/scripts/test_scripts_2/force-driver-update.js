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
    const orderId = 'cmirpv88q0002l204foso2se0';

    const order = await prisma.order.findUnique({
        where: { id: orderId }
    });

    if (!order) {
        console.log('❌ Order not found');
        return;
    }

    const updatedShipping = {
        ...order.shipping,
        status: 'ON_GOING',
        driver: {
            name: 'TestDriver 34567',
            phone: '+631001234567',
            plateNumber: 'ABC1234',
            vehicleType: 'MOTORCYCLE'
        },
        lastSyncedAt: new Date().toISOString()
    };

    await prisma.order.update({
        where: { id: orderId },
        data: {
            shipping: updatedShipping
        }
    });

    console.log('✅ Manually updated order with driver info!');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
