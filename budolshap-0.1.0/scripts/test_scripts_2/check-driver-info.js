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
    const orderId = 'cmirgrfvn0004jm04gl3j9cxn';

    const order = await prisma.order.findUnique({
        where: { id: orderId }
    });

    if (!order) {
        console.log('❌ Order not found');
        return;
    }

    console.log(`Order ID: ${order.id}`);
    console.log(`Status: ${order.status}`);
    console.log(`Booking ID: ${order.shipping?.bookingId}`);

    if (order.shipping?.driver) {
        console.log('\n✅ DRIVER INFO FOUND:');
        console.log(`   Name: ${order.shipping.driver.name}`);
        console.log(`   Phone: ${order.shipping.driver.phone}`);
        console.log(`   Vehicle: ${order.shipping.driver.vehicleType}`);
        console.log(`   Plate: ${order.shipping.driver.plateNumber}`);
    } else {
        console.log('\n❌ No driver info in database');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
