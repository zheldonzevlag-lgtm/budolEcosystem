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
    const bookingId = '3378367340558635381';
    const orderId = 'cmirn5nie0002js04k29n3fxy';

    console.log('📦 Simulating ON_GOING webhook with driver info');
    console.log('Order:', orderId);
    console.log('Booking ID:', bookingId);

    // ON_GOING webhook with driver info
    const payload = {
        event: 'ORDER_STATUS_CHANGED',
        orderId: bookingId,
        status: 'ON_GOING',
        timestamp: new Date().toISOString(),
        driver: {
            name: 'TestDriver 34567',
            phone: '+631001234567',
            plateNumber: 'ABC1234',
            vehicleType: 'MOTORCYCLE'
        }
    };

    await sendWebhook(payload);

    console.log('\n✅ Webhook sent!');
    console.log('\n📋 Next steps:');
    console.log('1. Refresh order page: https://budolshap.vercel.app/orders/' + orderId);
    console.log('2. Check if driver information appears below the map');
}

main().catch(console.error);
