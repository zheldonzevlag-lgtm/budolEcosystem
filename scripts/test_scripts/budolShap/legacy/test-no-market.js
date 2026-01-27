require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const crypto = require('crypto');

const apiKey = process.env.LALAMOVE_CLIENT_ID;
const apiSecret = process.env.LALAMOVE_CLIENT_SECRET;

const timestamp = Date.now().toString();
const method = 'GET';
const path = '/v3/cities';
const body = '';

const CRLF = String.fromCharCode(13, 10);
const rawSignature = timestamp + CRLF + method + CRLF + path + CRLF + CRLF + body;
const signature = crypto.createHmac('sha256', apiSecret).update(rawSignature).digest('hex');

async function test() {
    try {
        const response = await axios({
            method: 'GET',
            url: 'https://rest.sandbox.lalamove.com/v3/cities',
            headers: {
                'Authorization': `hmac ${apiKey}:${timestamp}:${signature}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
                // NO Market header
            }
        });
        console.log('SUCCESS! Cities:', response.data.data.map(c => `${c.name} (${c.code})`).join(', '));
    } catch (error) {
        console.log('FAILED:', error.response?.data?.errors?.[0]?.id || error.message);
    }
}

test();
