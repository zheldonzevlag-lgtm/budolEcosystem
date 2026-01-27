require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const crypto = require('crypto');

const apiKey = process.env.LALAMOVE_CLIENT_ID;
const apiSecret = process.env.LALAMOVE_CLIENT_SECRET;

async function testMarket(market) {
    const timestamp = Date.now().toString();
    const method = 'GET';
    const path = '/v3/cities';
    const body = '';

    // Correct HMAC generation with actual CRLF
    const CRLF = String.fromCharCode(13, 10);
    const rawSignature = timestamp + CRLF + method + CRLF + path + CRLF + CRLF + body;
    const signature = crypto.createHmac('sha256', apiSecret).update(rawSignature).digest('hex');

    console.log(`Testing Market: ${market}`);

    try {
        const response = await axios({
            method: 'GET',
            url: 'https://rest.sandbox.lalamove.com/v3/cities',
            headers: {
                'Authorization': `hmac ${apiKey}:${timestamp}:${signature}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Market': market
            }
        });
        console.log(`SUCCESS! Market "${market}" is valid.`);
        const cities = response.data.data;
        console.log('Cities:', cities.map(c => `${c.name} (${c.code})`).join(', '));

        // Check services for Manila (PH_MNL)
        const manila = cities.find(c => c.code === 'PH_MNL');
        if (manila) {
            const services = manila.services.map(s => s.key).join(', ');
            console.log('Manila Services:', services);
            require('fs').writeFileSync('ph_services_list.txt', services);
        }
        return true;
    } catch (error) {
        console.log(`FAILED. Market "${market}":`, error.response?.data?.errors?.[0]?.id || error.message);
        return false;
    }
}

testMarket('PH');
