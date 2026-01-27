// Enhanced test script to see exact Lalamove API error
const axios = require('axios');
const crypto = require('crypto');

// Load environment variables
require('dotenv').config();

const LALAMOVE_CLIENT_ID = process.env.LALAMOVE_CLIENT_ID;
const LALAMOVE_CLIENT_SECRET = process.env.LALAMOVE_CLIENT_SECRET;
const LALAMOVE_ENV = process.env.LALAMOVE_ENV || 'sandbox';

console.log('🚚 Testing Lalamove API Directly...\n');
console.log('Environment:', LALAMOVE_ENV);
console.log('Client ID:', LALAMOVE_CLIENT_ID ? 'Present' : 'Missing');
console.log('Client Secret:', LALAMOVE_CLIENT_SECRET ? 'Present' : 'Missing');

const baseUrl = LALAMOVE_ENV === 'production' 
    ? 'https://rest.lalamove.com' 
    : 'https://rest.sandbox.lalamove.com';

function generateSignature(method, path, timestamp, body = '') {
    const CRLF = String.fromCharCode(13, 10);
    const rawSignature = timestamp + CRLF + method + CRLF + path + CRLF + CRLF + body;
    return crypto
        .createHmac('sha256', LALAMOVE_CLIENT_SECRET)
        .update(rawSignature)
        .digest('hex');
}

async function testLalamoveQuote() {
    const timestamp = new Date().getTime().toString();
    const path = '/v3/quotations';
    const method = 'POST';
    
    const payload = {
        serviceType: 'MOTORCYCLE',
        stops: [
            {
                coordinates: {
                    lat: '14.5505',
                    lng: '121.0260'
                },
                address: 'Glorietta 4, Ayala Center, Makati, Metro Manila'
            },
            {
                coordinates: {
                    lat: '14.5545',
                    lng: '121.0245'
                },
                address: '123 Test Street, Makati, Metro Manila'
            }
        ],
        language: 'en_PH'
    };

    const body = JSON.stringify(payload);
    const signature = generateSignature(method, path, timestamp, body);

    console.log('\n📤 Request Details:');
    console.log('URL:', baseUrl + path);
    console.log('Method:', method);
    console.log('Market:', 'PH');
    console.log('Request-ID:', crypto.randomUUID());
    console.log('Payload:', JSON.stringify(payload, null, 2));

    try {
        const response = await axios({
            method,
            url: baseUrl + path,
            headers: {
                'Authorization': `hmac ${LALAMOVE_CLIENT_ID}:${timestamp}:${signature}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Market': 'PH',
                'Request-ID': crypto.randomUUID()
            },
            data: payload
        });

        console.log('\n✅ Success! Response:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('\n❌ Error Details:');
        console.error('Status:', error.response?.status);
        console.error('Status Text:', error.response?.statusText);
        console.error('Response Data:', JSON.stringify(error.response?.data, null, 2));
        console.error('Error Message:', error.message);
    }
}

testLalamoveQuote();