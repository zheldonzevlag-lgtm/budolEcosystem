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
    // Target specific booking ID from screenshot
    const targetBookingId = '3378364575488890072';

    console.log(`🔍 Finding order with Booking ID: ${targetBookingId}...\n`);

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

    console.log(`✅ Found order: ${order.id}`);
    console.log(`   Current Status: ${order.status}`);

    // Send COMPLETED webhook
    console.log('\n📦 Sending COMPLETED webhook to update status...');
    const completedPayload = {
        orderId: targetBookingId,
        event: 'COMPLETED',
        status: 'COMPLETED',
        driver: {
            name: 'TestDriver 34567',
            phone: '+631001234567',
            plateNumber: 'VP******4',
            vehicleType: 'Motorcycle'
        },
        timestamp: new Date().toISOString()
    };

    try {
        const result = await sendWebhook(completedPayload);
        console.log('   ✅ COMPLETED sent');
        console.log('   Response:', JSON.stringify(result.data, null, 2));

        // Verify update
        const updated = await prisma.order.findUnique({
            where: { id: order.id }
        });

        console.log(`\n✅ Order updated!`);
        console.log(`   New Status: ${updated.status}`);
        console.log(`   Delivered At: ${updated.deliveredAt}`);

    } catch (error) {
        console.error('\n❌ Webhook failed:', error.message);
    }

    await prisma.$disconnect();
}

main();
