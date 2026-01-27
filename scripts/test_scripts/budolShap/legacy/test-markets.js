require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const crypto = require('crypto');

const apiKey = process.env.LALAMOVE_CLIENT_ID;
const apiSecret = process.env.LALAMOVE_CLIENT_SECRET;
const baseUrl = 'https://rest.sandbox.lalamove.com';

async function testMarkets() {
    const markets = ['PH', 'PH_MNL', 'MNL', 'MANILA', 'PH_MANILA'];

    for (const market of markets) {
        try {
            const timestamp = new Date().getTime().toString();
            const path = '/v3/cities';
            const method = 'GET';
            const body = '';

            const rawSignature = `${timestamp}\\r\\n${method}\\r\\n${path}\\r\\n\\r\\n${body}`;
            const signature = crypto.createHmac('sha256', apiSecret).update(rawSignature).digest('hex');

            const response = await axios({
                method,
                url: `${baseUrl}${path}`,
                headers: {
                    'Authorization': `hmac ${apiKey}:${timestamp}:${signature}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Market': market
                }
            });

            console.log(`✓ Market "${market}" works!`);
            if (response.data && response.data.data) {
                console.log(`  Cities: ${response.data.data.map(c => c.code).join(', ')}`);
            }
            break; // Stop on first success
        } catch (error) {
            console.log(`✗ Market "${market}" failed: ${error.response?.data?.errors?.[0]?.id || error.message}`);
        }
    }
}

testMarkets();
