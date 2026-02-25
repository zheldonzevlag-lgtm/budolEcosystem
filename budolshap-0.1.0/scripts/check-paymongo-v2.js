
import https from 'https';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env.local if it exists, otherwise .env
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
} else {
    dotenv.config();
}

const secretKey = process.env.PAYMONGO_SECRET_KEY;

console.log('--- PayMongo Configuration Check v2 ---');

if (!secretKey) {
    console.error('❌ PAYMONGO_SECRET_KEY is MISSING in environment variables.');
    process.exit(1);
}

const keyType = secretKey.startsWith('sk_test_') ? 'TEST' : (secretKey.startsWith('sk_live_') ? 'LIVE' : 'UNKNOWN');
const maskedKey = `${secretKey.substring(0, 4)}...${secretKey.substring(secretKey.length - 4)}`;

console.log(`🔑 Key Type: ${keyType}`);
console.log(`🔒 Masked Key: ${maskedKey}`);

// Test API Connectivity
const options = {
    hostname: 'api.paymongo.com',
    path: '/v1/payment_intents?limit=5',
    method: 'GET',
    headers: {
        'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
        'Content-Type': 'application/json'
    }
};

console.log('\n📡 Testing API Connectivity...');

const req = https.request(options, (res) => {
    console.log(`Response Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode === 200) {
            console.log('✅ Connection Successful!');
            const response = JSON.parse(data);
            if (response.data && response.data.length > 0) {
                console.log(`Found ${response.data.length} recent Payment Intents:`);
                response.data.forEach((intent, index) => {
                    const amount = (intent.attributes.amount / 100).toFixed(2);
                    const currency = intent.attributes.currency;
                    const status = intent.attributes.status;
                    const created = new Date(intent.attributes.created_at * 1000).toLocaleString();
                    const desc = intent.attributes.description || 'No description';
                    console.log(`[${index + 1}] ID: ${intent.id} | Amount: ${amount} ${currency} | Status: ${status} | Date: ${created} | Desc: ${desc}`);
                });
            } else {
                console.log('ℹ️ No payment intents found (Account is empty or new).');
            }
        } else {
            console.error('❌ API Call Failed.');
            console.error('Response:', data);
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ Request Error: ${e.message}`);
});

req.end();
