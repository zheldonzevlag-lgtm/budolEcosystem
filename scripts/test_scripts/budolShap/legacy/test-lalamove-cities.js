require('dotenv').config({ path: '.env.local' });
const { getShippingProvider } = require('../../services/shippingFactory');

async function testCities() {
    try {
        const lalamove = getShippingProvider('lalamove');
        console.log('Testing Lalamove connection...');
        console.log('Market:', lalamove.market);
        console.log('API Key:', lalamove.apiKey ? '***' + lalamove.apiKey.slice(-4) : 'MISSING');

        const result = await lalamove.apiRequest('GET', '/v3/cities');
        if (result.data && result.data.length > 0) {
            const city = result.data[0];
            console.log(`City: ${city.name} (${city.code})`);
            console.log('Services:', city.services.map(s => s.key).join(', '));
        } else {
            console.log('No cities found');
        }
    } catch (error) {
        console.error('Error:', error.message);
        if (error.originalError) {
            console.error('Details:', JSON.stringify(error.originalError, null, 2));
        }
    }
}

testCities();
