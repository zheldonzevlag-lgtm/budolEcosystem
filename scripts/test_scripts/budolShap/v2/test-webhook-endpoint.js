/**
 * Test if the webhook endpoint is accessible and returns 200
 */

const https = require('https');

const options = {
    hostname: 'budolshap.vercel.app',
    path: '/api/webhooks/lalamove',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-lalamove-signature': 'test-signature'
    }
};

console.log('Testing webhook endpoint...\n');
console.log('URL: https://budolshap.vercel.app/api/webhooks/lalamove');
console.log('Method: POST\n');

const req = https.request(options, (res) => {
    console.log('✅ Response received!');
    console.log('Status Code:', res.statusCode);
    console.log('Status Message:', res.statusMessage);
    console.log('Headers:', JSON.stringify(res.headers, null, 2));

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('\nResponse Body:');
        console.log(data);

        if (res.statusCode === 200) {
            console.log('\n✅ SUCCESS: Webhook returns 200 status code');
            console.log('This means Lalamove should accept it!');
        } else {
            console.log('\n❌ ERROR: Webhook returns non-200 status code');
            console.log('Status:', res.statusCode);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Request failed:', error.message);
    console.error('This might be why Lalamove shows "Destination host unreachable"');
});

// Send a test payload
const testPayload = JSON.stringify({
    orderId: 'TEST123',
    event: 'ON_GOING',
    status: 'ON_GOING'
});

req.write(testPayload);
req.end();
