const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load production webhook secret
const envPath = path.join(__dirname, '..', '.env.production');
const envContent = fs.readFileSync(envPath, 'utf-8');
const secretMatch = envContent.match(/LALAMOVE_WEBHOOK_SECRET="?([^"\n]+)"?/);
const WEBHOOK_SECRET = secretMatch ? secretMatch[1] : null;

const bookingId = '3378364575488890120';

// 1. Send ON_GOING with driver info
const ongoingPayload = {
    orderId: bookingId,
    event: 'ON_GOING',
    status: 'ON_GOING',
    driver: {
        name: 'TestDriver 34567',
        phone: '+631001234567',
        plateNumber: 'VP******4',
        vehicleType: 'Motorcycle'
    },
    timestamp: new Date().toISOString()
};

// 2. Send PICKED_UP
const pickedUpPayload = {
    orderId: bookingId,
    event: 'PICKED_UP',
    status: 'PICKED_UP',
    driver: {
        name: 'TestDriver 34567',
        phone: '+631001234567',
        plateNumber: 'VP******4',
        vehicleType: 'Motorcycle'
    },
    timestamp: new Date().toISOString()
};

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
                resolve({ status: res.statusCode, data: JSON.parse(data) });
            });
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function main() {
    console.log('📦 Sending ON_GOING webhook...');
    const result1 = await sendWebhook(ongoingPayload);
    console.log('   Response:', result1.data);

    console.log('\n📦 Sending PICKED_UP webhook...');
    const result2 = await sendWebhook(pickedUpPayload);
    console.log('   Response:', result2.data);

    console.log('\n✅ Done! Check the order page now.');
}

main().catch(console.error);
