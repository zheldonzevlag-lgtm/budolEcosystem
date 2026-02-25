const crypto = require('crypto');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Try to load .env.local to get secrets
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value && !process.env[key]) {
                process.env[key.trim()] = value.trim();
            }
        });
        console.log('Loaded .env.local');
    }
} catch (e) {
    console.warn('Could not load .env.local, relying on process.env');
}

const WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
    console.error('Error: PAYMONGO_WEBHOOK_SECRET is not set in environment.');
    console.error('Please ensure .env.local exists and contains this key, or set it manually.');
    process.exit(1);
}

// Configuration
const ORDER_ID = process.argv[2]; // Pass Order ID as argument
const EVENT_TYPE = process.argv[3] || 'payment_intent.succeeded';
const PORT = 3000; // Assuming Next.js runs on 3000

if (!ORDER_ID) {
    console.error('Usage: node scripts/simulate-webhook.js <ORDER_ID> [EVENT_TYPE]');
    console.log('Example: node scripts/simulate-webhook.js order_clpq... payment_intent.succeeded');
    process.exit(1);
}

// Construct Payload
const timestamp = Math.floor(Date.now() / 1000);
const paymentId = `pay_${crypto.randomBytes(12).toString('hex')}`;
const intentId = `pi_${crypto.randomBytes(12).toString('hex')}`;

let dataAttributes = {
    type: EVENT_TYPE.split('.')[0], // 'payment' or 'payment_intent' or 'source'
    livemode: false,
    data: {
        id: EVENT_TYPE.includes('intent') ? intentId : paymentId,
        type: EVENT_TYPE.includes('intent') ? 'payment_intent' : 'payment',
        attributes: {
            amount: 10000, // 100.00
            status: 'succeeded',
            metadata: {
                orderId: ORDER_ID
            }
        }
    }
};

// Adjust payload structure based on event type if needed
if (EVENT_TYPE === 'payment.paid') {
    dataAttributes = {
        amount: 10000,
        status: 'paid',
        payment_intent_id: intentId,
        source: { id: 'src_test' },
        metadata: { orderId: ORDER_ID }
    };
} else if (EVENT_TYPE === 'payment_intent.succeeded') {
    // Already set up above mostly, but let's be precise
    dataAttributes = {
        amount: 10000,
        status: 'succeeded',
        metadata: { orderId: ORDER_ID }
    };
}

const payload = {
    data: {
        id: `evt_${crypto.randomBytes(12).toString('hex')}`,
        type: 'event',
        attributes: {
            type: EVENT_TYPE,
            livemode: false,
            data: {
                id: EVENT_TYPE === 'payment_intent.succeeded' ? intentId : paymentId,
                type: EVENT_TYPE.split('.')[0],
                attributes: dataAttributes
            }
        }
    }
};

const payloadString = JSON.stringify(payload);

// Generate Signature
const signatureString = `${timestamp}.${payloadString}`;
const signature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(signatureString)
    .digest('hex');

const headerSignature = `t=${timestamp},te=${signature},li=${signature}`; // paymongo sends test(te) and live(li) usually

console.log(`Sending ${EVENT_TYPE} webhook for Order ${ORDER_ID}...`);
console.log(`Target: http://localhost:${PORT}/api/webhooks/paymongo`);

const req = http.request({
    hostname: 'localhost',
    port: PORT,
    path: '/api/webhooks/paymongo',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'paymongo-signature': headerSignature,
        'Content-Length': Buffer.byteLength(payloadString)
    }
}, (res) => {
    console.log(`Response Status: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log('Response Body:', chunk);
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
    console.log('Ensure your local server is running (npm run dev).');
});

req.write(payloadString);
req.end();
