require('dotenv').config({ path: '.env.production' });
const axios = require('axios');
const crypto = require('crypto');

async function getRawLalamoveResponse() {
    try {
        const apiKey = process.env.LALAMOVE_CLIENT_ID;
        const apiSecret = process.env.LALAMOVE_CLIENT_SECRET;
        const env = process.env.LALAMOVE_ENV || 'sandbox';

        const baseUrl = env === 'production'
            ? 'https://rest.lalamove.com'
            : 'https://rest.sandbox.lalamove.com';

        const bookingId = '3379141263692874454';
        const path = `/v3/orders/${bookingId}`;
        const timestamp = new Date().getTime().toString();

        // Generate signature
        const CRLF = String.fromCharCode(13, 10);
        const rawSignature = timestamp + CRLF + 'GET' + CRLF + path + CRLF + CRLF;
        const signature = crypto
            .createHmac('sha256', apiSecret)
            .update(rawSignature)
            .digest('hex');

        console.log('Making request to:', baseUrl + path);
        console.log('Timestamp:', timestamp);
        console.log('');

        const response = await axios.get(baseUrl + path, {
            headers: {
                'Authorization': `hmac ${apiKey}:${timestamp}:${signature}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',

                console.log('Available top-level keys:', Object.keys(data));
                console.log('');

                if(data.driver) {
                    console.log('✅ Found data.driver:', JSON.stringify(data.driver, null, 2));
    }

        if (data.driverInfo) {
        console.log('✅ Found data.driverInfo:', JSON.stringify(data.driverInfo, null, 2));
    }

    if (data.driverId) {
        console.log('✅ Found data.driverId:', data.driverId);
    }

    if (data.driverName) {
        console.log('✅ Found data.driverName:', data.driverName);
    }

    // Check in stops
    if (data.stops && Array.isArray(data.stops)) {
        console.log('\n📍 Checking stops for driver info...');
        data.stops.forEach((stop, index) => {
            console.log(`Stop ${index}:`, Object.keys(stop));
            if (stop.driver) {
                console.log(`  ✅ Driver info in stop ${index}:`, stop.driver);
            }
        });
    }

} catch (error) {
    console.error('Error:', error.response?.data || error.message);
}
}

getRawLalamoveResponse();
