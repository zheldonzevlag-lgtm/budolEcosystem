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

    const CRLF = String.fromCharCode(13, 10);
    const rawSignature = timestamp + CRLF + method + CRLF + path + CRLF + CRLF + body;
    const signature = crypto.createHmac('sha256', apiSecret).update(rawSignature).digest('hex');

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
        console.log(`✓ Market "${market}" works! Cities:`, response.data.data.map(c => c.code).slice(0, 5).join(', '));
        return true;
    } catch (error) {
        console.log(`✗ Market "${market}": ${error.response?.data?.errors?.[0]?.id || error.message}`);
        return false;
    }
}

async function main() {
    const markets = [
        'HK',
        'SG',
        'TH',
        'TW',
        'VN',
        'MY',
        'ID',
        'BR',
        'AR',
        'CL',
        'CO',
        'CR',
        'MX',
        'PE'
    ];

    for (const market of markets) {
        const success = await testMarket(market);
        if (success) break;
        await new Promise(r => setTimeout(r, 100));
    }
}

main();
