// Test with minimal Lalamove API request
const axios = require('axios');
const crypto = require('crypto');

// Load environment variables
require('dotenv').config();

const LALAMOVE_CLIENT_ID = process.env.LALAMOVE_CLIENT_ID;
const LALAMOVE_CLIENT_SECRET = process.env.LALAMOVE_CLIENT_SECRET;
const LALAMOVE_ENV = process.env.LALAMOVE_ENV || 'sandbox';

console.log('🚚 Testing Minimal Lalamove API Request...\n');

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

async function testMinimalQuote() {
    const timestamp = new Date().getTime().toString();
    const path = '/v3/quotations';
    const method = 'POST';
    
    // Minimal payload with just coordinates
    const payload = {
        serviceType: 'MOTORCYCLE',
        stops: [
            {
                coordinates: {
                    lat: '14.5505',
                    lng: '121.0260'
                }
            },
            {
                coordinates: {
                    lat: '14.5545',
                    lng: '121.0245'
                }
            }
        ]
    };

    const body = JSON.stringify(payload);
    const signature = generateSignature(method, path, timestamp, body);

    console.log('📤 Minimal Request:');
    console.log('URL:', baseUrl + path);
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
        
        // Check if it's a credential issue
        if (error.response?.status === 401) {
            console.error('\n🔑 Possible credential issue. Check your API key and secret.');
        }
    }
}

testMinimalQuote();