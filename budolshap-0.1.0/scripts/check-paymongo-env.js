import https from 'https';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
    console.log(`Loading environment from ${envLocalPath}`);
    dotenv.config({ path: envLocalPath });
} else {
    console.log('Loading environment from .env');
    dotenv.config();
}

const secretKey = process.env.PAYMONGO_SECRET_KEY;

console.log('\n--- PayMongo Configuration Check ---');

if (!secretKey) {
    console.error('❌ PAYMONGO_SECRET_KEY is MISSING in environment variables.');
    process.exit(1);
}

// Mask the key for display
const maskedKey = secretKey.length > 8 
    ? `${secretKey.substring(0, 4)}...${secretKey.substring(secretKey.length - 4)}` 
    : '****';

console.log(`🔑 Key Type: ${secretKey.startsWith('sk_test') ? 'TEST' : 'LIVE'}`);
console.log(`🔒 Masked Key: ${maskedKey}`);

// Create a dummy Payment Intent to verify API access
const postData = JSON.stringify({
    data: {
        attributes: {
            amount: 10000, // 100.00 PHP
            payment_method_allowed: ['card', 'gcash'],
            currency: 'PHP',
            description: 'API Key Verification Check',
            capture_type: 'automatic'
        }
    }
});

const options = {
    hostname: 'api.paymongo.com',
    path: '/v1/payment_intents',
    method: 'POST',
    headers: {
        'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
        'Content-Length': postData.length
    }
};

console.log('\n📡 Testing API Connectivity (Creating Dummy Payment Intent)...');

const req = https.request(options, (res) => {
    let data = '';

    console.log(`Response Status: ${res.statusCode}`);

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            
            if (res.statusCode >= 200 && res.statusCode < 300) {
                console.log('✅ API Connection Successful!');
                console.log(`✅ Created Payment Intent ID: ${response.data.id}`);
                console.log(`   Status: ${response.data.attributes.status}`);
                console.log(`   Client Key: ${response.data.attributes.client_key.substring(0, 10)}...`);
                console.log('\n✨ This confirms your API key is valid and can create payments.');
                console.log('   Check your PayMongo Dashboard for this intent to verify the account.');
            } else {
                console.error('❌ API Call Failed.');
                console.error('Response:', JSON.stringify(response, null, 2));
            }
        } catch (e) {
            console.error('❌ Failed to parse response:', e.message);
            console.error('Raw Response:', data);
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ Request Error: ${e.message}`);
});

req.write(postData);
req.end();
