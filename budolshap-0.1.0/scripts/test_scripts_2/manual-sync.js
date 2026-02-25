const https = require('https');

const orderId = 'cmirn5nie0002js04k29n3fxy';
const url = `https://budolshap.vercel.app/api/orders/${orderId}/sync-lalamove`;

console.log('Calling sync endpoint:', url);
console.log('This will fetch driver info from Lalamove API...\n');

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Response Status:', res.statusCode);
        console.log('\nResponse Body:');
        try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json, null, 2));

            if (json.driver) {
                console.log('\n✅ DRIVER INFO FOUND:');
                console.log('Name:', json.driver.name);
                console.log('Phone:', json.driver.phone);
                console.log('Plate:', json.driver.plateNumber);
                console.log('Vehicle:', json.driver.vehicleType);
            } else {
                console.log('\n❌ No driver info returned');
            }
        } catch (e) {
            console.log(data);
        }
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
