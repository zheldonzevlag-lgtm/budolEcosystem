const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.production');
const envContent = fs.readFileSync(envPath, 'utf-8');
const webhookSecretMatch = envContent.match(/LALAMOVE_WEBHOOK_SECRET="([^"]+)"/);
const WEBHOOK_SECRET = webhookSecretMatch[1];

const WEBHOOK_URL = 'budolshap.vercel.app';
const WEBHOOK_PATH = '/api/webhooks/lalamove';

// Get the latest order
const { PrismaClient } = require('@prisma/client');
const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);
const DATABASE_URL = dbUrlMatch[1].replace(/\n/g, '');

const prisma = new PrismaClient({
    datasources: { db: { url: DATABASE_URL } }
});

function generateSignature(payload) {
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    const signature = hmac.update(JSON.stringify(payload)).digest('hex');
    return signature;
}

function sendWebhook(payload) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(payload);
        const signature = generateSignature(payload);

        const options = {
            hostname: WEBHOOK_URL,
            port: 443,
            path: WEBHOOK_PATH,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
                'x-lalamove-signature': signature
            }
        };

        console.log(`\n📤 Sending ${payload.event} webhook...`);
        console.log('Signature:', signature);

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`✅ Response: ${res.statusCode}`);
                console.log('Body:', data);
                resolve({ statusCode: res.statusCode, body: data });
            });
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function main() {
    // Get the latest Lalamove order
    const order = await prisma.order.findFirst({
        where: {
            shipping: {
                path: ['provider'],
                equals: 'lalamove'
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    if (!order || !order.shipping?.bookingId) {
        console.log('❌ No Lalamove order found');
        return;
    }

    console.log('📦 Testing with order:', order.id);
    console.log('🔖 Booking ID:', order.shipping.bookingId);

    // Wait 2 seconds between webhooks
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // 1. ON_GOING webhook (driver assigned)
    const onGoingPayload = {
        event: 'ORDER_STATUS_CHANGED',
        orderId: order.shipping.bookingId,
        status: 'ON_GOING',
        timestamp: new Date().toISOString(),
        driver: {
            name: 'TestDriver 34567',
            phone: '+631001234567',
            plateNumber: 'ABC1234',
            vehicleType: 'MOTORCYCLE',
            rating: 4.8
        }
    };

    await sendWebhook(onGoingPayload);
    await wait(2000);

    // 2. PICKED_UP webhook
    const pickedUpPayload = {
        event: 'ORDER_STATUS_CHANGED',
        orderId: order.shipping.bookingId,
        status: 'PICKED_UP',
        timestamp: new Date().toISOString(),
        driver: {
            name: 'TestDriver 34567',
            phone: '+631001234567',
            plateNumber: 'ABC1234',
            vehicleType: 'MOTORCYCLE',
            rating: 4.8
        }
    };

    await sendWebhook(pickedUpPayload);
    await wait(2000);

    // 3. COMPLETED webhook
    const completedPayload = {
        event: 'ORDER_STATUS_CHANGED',
        orderId: order.shipping.bookingId,
        status: 'COMPLETED',
        timestamp: new Date().toISOString()
    };

    await sendWebhook(completedPayload);

    console.log('\n✅ All webhooks sent!');
    console.log('\n📋 Next steps:');
    console.log('1. Check order page: https://budolshap.vercel.app/orders/' + order.id);
    console.log('2. Verify driver information appears');
    console.log('3. Verify status changes: PROCESSING → SHIPPED → DELIVERED');

    await prisma.$disconnect();
}

main().catch(console.error);
