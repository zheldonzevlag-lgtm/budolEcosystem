/**
 * Manually fetch driver information from Lalamove API and update database
 * Use this when webhooks are not received
 */

const { PrismaClient } = require('@prisma/client');
const { getShippingProvider } = require('../services/shippingFactory');
const fs = require('fs');
const path = require('path');

// Load production environment variables
const envPath = path.join(__dirname, '..', '.env.production');
const envContent = fs.readFileSync(envPath, 'utf-8');

// Parse environment variables
const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);
const DATABASE_URL = dbUrlMatch[1].replace(/\n/g, '');

// Load Lalamove credentials
const clientIdMatch = envContent.match(/LALAMOVE_CLIENT_ID="?([^"\n]+)"?/);
const clientSecretMatch = envContent.match(/LALAMOVE_CLIENT_SECRET="?([^"\n]+)"?/);
const webhookSecretMatch = envContent.match(/LALAMOVE_WEBHOOK_SECRET="?([^"\n]+)"?/);
const envMatch = envContent.match(/LALAMOVE_ENV="?([^"\n]+)"?/);

// Set environment variables for Lalamove service
process.env.LALAMOVE_CLIENT_ID = clientIdMatch ? clientIdMatch[1] : '';
process.env.LALAMOVE_CLIENT_SECRET = clientSecretMatch ? clientSecretMatch[1] : '';
process.env.LALAMOVE_WEBHOOK_SECRET = webhookSecretMatch ? webhookSecretMatch[1] : '';
process.env.LALAMOVE_ENV = envMatch ? envMatch[1] : 'sandbox';

const prisma = new PrismaClient({
    datasources: { db: { url: DATABASE_URL } }
});

async function main() {
    console.log('🔍 Finding latest Lalamove order...\n');

    // Find the most recent order with Lalamove
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
        console.log('❌ No Lalamove orders found');
        return;
    }

    const bookingId = order.shipping?.bookingId;
    if (!bookingId) {
        console.log('❌ Order has no booking ID');
        return;
    }

    console.log(`✅ Found order: ${order.id}`);
    console.log(`   Booking ID: ${bookingId}`);
    console.log(`   Current status: ${order.status}\n`);

    // Fetch current driver information from Lalamove
    console.log('📡 Fetching driver information from Lalamove API...\n');

    try {
        const lalamove = getShippingProvider('lalamove');
        const trackingData = await lalamove.trackOrder(bookingId);

        console.log('✅ Tracking data received:');
        console.log(JSON.stringify(trackingData, null, 2));

        if (trackingData.driver) {
            console.log('\n📝 Updating database with driver information...');

            // Update the order with driver information
            const updatedShipping = {
                ...order.shipping,
                driver: {
                    name: trackingData.driver.name,
                    phone: trackingData.driver.phone,
                    plateNumber: trackingData.driver.plateNumber,
                    vehicleType: trackingData.driver.vehicleType || 'Unknown'
                },
                status: trackingData.status,
                lastUpdated: new Date().toISOString()
            };

            await prisma.order.update({
                where: { id: order.id },
                data: {
                    shipping: updatedShipping
                }
            });

            console.log('\n✅ Database updated successfully!');
            console.log('\nDriver Information:');
            console.log(`  Name: ${trackingData.driver.name}`);
            console.log(`  Phone: ${trackingData.driver.phone}`);
            console.log(`  Plate: ${trackingData.driver.plateNumber}`);
            console.log(`  Vehicle: ${trackingData.driver.vehicleType || 'Unknown'}`);
        } else {
            console.log('\n⚠️  No driver assigned yet');
            console.log(`   Order status: ${trackingData.status}`);
        }

    } catch (error) {
        console.error('\n❌ Error fetching tracking data:', error.message);
        console.error(error);
    }

    await prisma.$disconnect();
}

main();
