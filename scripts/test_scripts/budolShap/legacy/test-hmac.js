require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const crypto = require('crypto');

const apiKey = process.env.LALAMOVE_CLIENT_ID;
const apiSecret = process.env.LALAMOVE_CLIENT_SECRET;

console.log('API Key:', apiKey);
console.log('API Secret:', apiSecret ? '***' + apiSecret.slice(-10) : 'MISSING');

const timestamp = Date.now().toString();
const method = 'GET';
const path = '/v3/cities';
const body = '';

// Generate signature exactly as per Lalamove docs
const CRLF = String.fromCharCode(13, 10);
const rawSignature = timestamp + CRLF + method + CRLF + path + CRLF + CRLF + body;

console.log('Raw signature (hex):', Buffer.from(rawSignature).toString('hex'));
console.log('Raw signature length:', rawSignature.length);

const signature = crypto.createHmac('sha256', apiSecret).update(rawSignature).digest('hex');

console.log('Signature:', signature);
console.log('Timestamp:', timestamp);
console.log('Auth header:', `hmac ${apiKey}:${timestamp}:${signature}`);

async function test() {
    try {
        const response = await axios({
            method: 'GET',
            url: 'https://rest.sandbox.lalamove.com/v3/cities',
            headers: {
                'Authorization': `hmac ${apiKey}:${timestamp}:${signature}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Market': 'PH_MNL'
            }
        });
        console.log('SUCCESS!');
        console.log('Response:', response.data);
    } catch (error) {
        console.log('FAILED');
        console.log('Error:', error.response?.data || error.message);
    }
}

test();
