// Test Lalamove API health and credentials
const axios = require('axios');
const crypto = require('crypto');

// Load environment variables
require('dotenv').config();

const LALAMOVE_CLIENT_ID = process.env.LALAMOVE_CLIENT_ID;
const LALAMOVE_CLIENT_SECRET = process.env.LALAMOVE_CLIENT_SECRET;
const LALAMOVE_ENV = process.env.LALAMOVE_ENV || 'sandbox';

console.log('🔍 Testing Lalamove API Health and Credentials...\n');

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

async function testApiHealth() {
    const timestamp = new Date().getTime().toString();
    const path = '/v3/cities';
    const method = 'GET';
    const signature = generateSignature(method, path, timestamp);

    console.log('📡 Testing API Health (GET /v3/cities)...');
    console.log('URL:', baseUrl + path);

    try {
        const response = await axios({
            method,
            url: baseUrl + path,
            headers: {
                'Authorization': `hmac ${LALAMOVE_CLIENT_ID}:${timestamp}:${signature}`,
                'Accept': 'application/json',
                'Market': 'PH',
                'Request-ID': crypto.randomUUID()
            }
        });

        console.log('✅ API Health Check Successful!');
        console.log('📍 Available Cities:', response.data.data.map(city => city.name).join(', '));
        
        // Now test if Manila is available
        const manilaCity = response.data.data.find(city => city.name.toLowerCase().includes('manila'));
        if (manilaCity) {
            console.log('✅ Manila found in service area!');
            console.log('📍 Manila City ID:', manilaCity.id);
        } else {
            console.log('⚠️ Manila not found in available cities');
            console.log('📍 Available cities:', response.data.data.map(city => city.name));
        }
        
    } catch (error) {
        console.error('\n❌ API Health Check Failed:');
        console.error('Status:', error.response?.status);
        console.error('Status Text:', error.response?.statusText);
        console.error('Response Data:', JSON.stringify(error.response?.data, null, 2));
        
        if (error.response?.status === 401) {
            console.error('\n🔑 Authentication failed. Check your API credentials.');
        } else if (error.response?.status === 502) {
            console.error('\n🌐 Lalamove sandbox server might be temporarily unavailable.');
        }
    }
}

testApiHealth();