// Debug script to check what the API actually returns

async function debugAPI() {
    const orderId = 'cmit616oc0002jm04ds6ycekv';
    const apiUrl = `https://budulshap.vercel.app/api/orders/${orderId}`;

    console.log('Fetching from API:', apiUrl);
    console.log('');

    try {
        const response = await fetch(apiUrl, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) {
            console.log('❌ API Error:', response.status);
            return;
        }

        const data = await response.json();

        console.log('='.repeat(80));
        console.log('API RESPONSE ANALYSIS');
        console.log('='.repeat(80));
        console.log('');

        console.log('Order ID:', data.id);
        console.log('Status:', data.status);
        console.log('');

        console.log('Shipping object type:', typeof data.shipping);
        console.log('Shipping object:', data.shipping);
        console.log('');

        if (data.shipping) {
            console.log('Shipping keys:', Object.keys(data.shipping));
            console.log('');
            console.log('Has driver key?', 'driver' in data.shipping);
            console.log('Driver value:', data.shipping.driver);
            console.log('Driver type:', typeof data.shipping.driver);
            console.log('');
            console.log('Has location key?', 'location' in data.shipping);
            console.log('Location value:', data.shipping.location);
            console.log('Location type:', typeof data.shipping.location);
            console.log('');

            // Check if driver is an empty object
            if (data.shipping.driver) {
                console.log('Driver object keys:', Object.keys(data.shipping.driver));
                console.log('Driver object values:', Object.values(data.shipping.driver));
                console.log('Driver.name:', data.shipping.driver.name);
                console.log('Driver.phone:', data.shipping.driver.phone);
            }
        } else {
            console.log('❌ NO SHIPPING OBJECT IN RESPONSE');
        }

        console.log('');
        console.log('='.repeat(80));
        console.log('FULL SHIPPING OBJECT (JSON):');
        console.log('='.repeat(80));
        console.log(JSON.stringify(data.shipping, null, 2));

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

debugAPI();
