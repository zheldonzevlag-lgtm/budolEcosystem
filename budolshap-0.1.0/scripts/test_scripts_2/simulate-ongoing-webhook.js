/**
 * Manually simulate ON_GOING webhook for current order
 * This is needed because the webhook was registered AFTER the driver was assigned
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

// Load production environment variables
const envPath = path.join(__dirname, '..', '.env.production');
const envContent = fs.readFileSync(envPath, 'utf-8');
const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);
const DATABASE_URL = dbUrlMatch[1].replace(/\n/g, '');

const secretMatch = envContent.match(/LALAMOVE_WEBHOOK_SECRET="?([^"\n]+)"?/);
const WEBHOOK_SECRET = secretMatch ? secretMatch[1] : null;

const prisma = new PrismaClient({
    datasources: { db: { url: DATABASE_URL } }
});

function sendWebhook(payload) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(payload);
        const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
        const signature = hmac.update(body).digest('hex');

        const options = {
            method: 'POST',
            hostname: 'budolshap.vercel.app',
            path: '/api/webhooks/lalamove',
            headers: {
                'Content-Type': 'application/json',
                'x-lalamove-signature': signature,
                'Content-Length': Buffer.byteLength(body)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function main() {
    console.log('🔍 Finding latest PROCESSING order...\n');

    // Target specific booking ID from screenshot
    const targetBookingId = '3378367340550247259';

    const order = await prisma.order.findFirst({
        where: {
            shipping: {
                path: ['bookingId'],
                equals: targetBookingId
            }
        },
        include: { user: true, store: true }
    });

    if (!order) {
        console.error('❌ Order not found');
        return;
    }

    const bookingId = order.shipping?.bookingId;
    console.log(`✅ Found order: ${order.id}`);
    console.log(`   Booking ID: ${bookingId}`);
    console.log(`   Customer: ${order.user.email}`);
    console.log(`   Store: ${order.store.name}\n`);

    // Simulate ON_GOING event with driver info from Lalamove Partner Portal
    console.log('📦 Sending ON_GOING webhook with driver info...\n');

    const payload = {
        orderId: bookingId,
        event: 'ON_GOING',
        status: 'ON_GOING',
        driver: {
            name: 'TestDriver 34567',
            phone: '+631001234567', // Updated phone from screenshot
            plateNumber: 'VP******4',
            vehicleType: 'Motorcycle'
        },
        location: {
            lat: '14.5505',
            lng: '121.0260'
        },
        timestamp: new Date().toISOString()
    };

    try {
        const result = await sendWebhook(payload);
        console.log('✅ Webhook sent successfully!');
        console.log('   Response:', JSON.stringify(result.data, null, 2));

        // Verify update
        const updated = await prisma.order.findUnique({
            where: { id: order.id }
        });

        console.log(`\n✅ Order updated!`);
        console.log(`   Status: ${updated.status}`);

        if (updated.shipping?.driver) {
            console.log(`\n📋 Driver info stored:`);
            console.log(JSON.stringify(updated.shipping.driver, null, 2));
        } else {
            console.log('\n❌ Driver info NOT stored');
        }

    } catch (error) {
        console.error('\n❌ Webhook failed:', error.message);
    }

    await prisma.$disconnect();
}

main();
