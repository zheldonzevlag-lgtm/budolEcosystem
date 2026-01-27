const axios = require('axios');

async function testLocalApi() {
    try {
        console.log('--- Testing Homepage (127.0.0.1:3000) ---');
        const home = await axios.get('http://127.0.0.1:3000', { validateStatus: () => true });
        console.log('Homepage Status:', home.status);

        console.log('\n--- Testing Static File (127.0.0.1:3000/favicon.ico) ---');
        const fav = await axios.get('http://127.0.0.1:3000/favicon.ico', { validateStatus: () => true });
        console.log('Favicon Status:', fav.status);

        console.log('\n--- Testing Cart Page (127.0.0.1:3000/cart) ---');
        const cart = await axios.get('http://127.0.0.1:3000/cart', { validateStatus: () => true });
        console.log('Cart Status:', cart.status);

        console.log('\n--- Testing API Route (127.0.0.1:3000) ---');


        const response = await axios.post('http://127.0.0.1:3000/api/shipping/lalamove/quote', {
            pickup: {
                address: "Manila City Hall, Arroceros St, Ermita, Manila",
                coordinates: { lat: 14.5995, lng: 120.9842 }
            },
            delivery: {
                address: "Makati City Hall, J.P. Rizal Ave, Poblacion, Makati",
                coordinates: { lat: 14.5547, lng: 121.0244 }
            },
            package: { weight: 1 }
        }, {
            headers: { 'Content-Type': 'application/json' },
            validateStatus: () => true
        });

        console.log('Status:', response.status);
        console.log('Headers:', response.headers['content-type']);
        console.log('Body Preview:', typeof response.data === 'string' ? response.data.substring(0, 500) : JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}


testLocalApi();
