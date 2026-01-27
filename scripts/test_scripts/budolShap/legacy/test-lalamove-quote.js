// Test script to trigger Lalamove quote error
async function testLalamoveQuote() {
    console.log('🚚 Testing Lalamove Quote API...\n');
    
    const testPayload = {
        pickup: {
            address: "Glorietta 4, Ayala Center, Makati, Metro Manila",
            coordinates: { lat: 14.5505, lng: 121.0260 },
            contactName: "BudolShap Store",
            contactPhone: "+639170000000"
        },
        delivery: {
            address: "123 Test Street, Makati, Metro Manila",
            coordinates: { lat: 14.5545, lng: 121.0245 },
            contactName: "Test Customer",
            contactPhone: "+639171234567"
        },
        package: {
            weight: 2,
            description: "Test order"
        }
    };

    console.log('📤 Request payload:', JSON.stringify(testPayload, null, 2));
    
    try {
        const response = await fetch('http://localhost:3000/api/shipping/lalamove/quote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testPayload)
        });

        console.log(`📥 Response status: ${response.status}`);
        
        const data = await response.json();
        console.log('📥 Response data:', JSON.stringify(data, null, 2));
        
        if (!response.ok) {
            console.error('❌ Quote failed:', data.message || data.error);
        } else {
            console.log('✅ Quote successful:', data);
        }
        
    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
}

testLalamoveQuote();