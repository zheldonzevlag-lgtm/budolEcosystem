
// Testing script for Lalamove Quote API
async function testApi() {
    console.log('Testing Lalamove Quote API...');
    
    const payload = {
        pickup: {
            address: "Glorietta 4, Ayala Center, Makati, Metro Manila",
            coordinates: { lat: 14.5505, lng: 121.0260 }
        },
        delivery: {
            address: "123 Test Street, Makati, Metro Manila",
            coordinates: { lat: 14.5545, lng: 121.0245 },
            name: "Test Customer",
            phone: "+639171234567"
        },
        items: [{ id: 1, name: 'Test Item', weight: 1 }]
    };

    try {
        const response = await fetch('http://localhost:3000/api/shipping/lalamove/quote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Data:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testApi();
