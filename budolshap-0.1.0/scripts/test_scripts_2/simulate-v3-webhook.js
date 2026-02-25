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

        console.log(`\n📤 Sending ${payload.eventType} webhook (v3)...`);

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
    const bookingId = '3378364575480500901'; // Current fresh order
    const orderId = 'cmirquhpe0002jm04hqnlrbrp';

    console.log('📦 Simulating DRIVER_ASSIGNED v3 webhook');
    console.log('Order:', orderId);
    console.log('Booking ID:', bookingId);

    // v3 Payload Structure based on Partner Portal screenshot
    const payload = {
        eventId: "B6D865EC-842D-4382-9AC8-869A5BFDBF4E",
        eventType: "DRIVER_ASSIGNED",
        eventVersion: "v3",
        data: {
            driver: {
                driverId: "80557",
                phone: "+631001234567",
                name: "TestDriver 34567",
                photo: "",
                plateNumber: "VP9946964"
            },
            location: {
                lng: 121.0260000,
                lat: 14.5505000
            },
            order: {
                orderId: bookingId
            },
            updatedAt: new Date().toISOString()
        }
    };

    await sendWebhook(payload);

    console.log('\n✅ Webhook sent!');
}

main().catch(console.error);
