const https = require('https');

const orderId = 'cmiribjt20004lc04bcmpiscm';
const url = `https://budolshap.vercel.app/api/orders/${orderId}/sync-lalamove`;

console.log('Calling sync endpoint:', url);

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('\nResponse Status:', res.statusCode);
        console.log('\nResponse Body:');
        try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json, null, 2));
        } catch (e) {
            console.log(data);
        }
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
