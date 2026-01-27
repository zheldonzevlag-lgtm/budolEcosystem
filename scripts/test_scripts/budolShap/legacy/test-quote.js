require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const crypto = require('crypto');

const apiKey = process.env.LALAMOVE_CLIENT_ID;
const apiSecret = process.env.LALAMOVE_CLIENT_SECRET;

async function testQuote() {
    const timestamp = Date.now().toString();
    const method = 'POST';
    const path = '/v3/quotations';

    const bodyData = {
        data: {
            serviceType: 'MOTORCYCLE',
            language: 'en_PH',
            stops: [
                {
                    coordinates: {
                        lat: "14.5904492",
                        lng: "120.9803621"
                    },
                    address: "Manila, Philippines"
                },
                {
                    coordinates: {
                        lat: "14.5662225",
                        lng: "121.0313787"
                    },
                    address: "Makati, Philippines"
                }
            ]
        }
    };

    const body = JSON.stringify(bodyData);

    const CRLF = String.fromCharCode(13, 10);
    const rawSignature = timestamp + CRLF + method + CRLF + path + CRLF + CRLF + body;
    const signature = crypto.createHmac('sha256', apiSecret).update(rawSignature).digest('hex');

    console.log('Testing Quote with PH market...');

    try {
        const response = await axios({
            method: 'POST',
            url: 'https://rest.sandbox.lalamove.com/v3/quotations',
            headers: {
                'Authorization': `hmac ${apiKey}:${timestamp}:${signature}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Market': 'PH'
            },
            data: bodyData
        });
        console.log('SUCCESS! Quote received:');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log('FAILED:', error.response?.data?.errors?.[0]?.id || error.message);
        if (error.response?.data) {
            console.log('Full Error:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testQuote();
