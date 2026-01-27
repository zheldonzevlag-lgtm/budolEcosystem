// Test the API endpoint directly
async function testApiEndpoint() {
    console.log('Testing API endpoint with fallback...\n');
    
    try {
        // Test data (same as what LalamoveWidget would send)
        const testPayload = {
            pickup: {
                address: "Glorietta 4, Ayala Center, Makati, Metro Manila",
                coordinates: { lat: 14.5505, lng: 121.0260 }
            },
            delivery: {
                address: "Quezon City, Metro Manila", 
                coordinates: { lat: 14.6760, lng: 121.0437 }
            },
            package: {
                weight: 2.5 // kg
            },
            serviceType: 'MOTORCYCLE'
        };
        
        console.log('🧪 Making API request to /api/shipping/lalamove/quote...');
        
        const response = await fetch('http://localhost:3000/api/shipping/lalamove/quote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testPayload)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            console.log('❌ API request failed:', response.status, response.statusText);
            console.log('Error data:', data);
            return;
        }
        
        console.log('\n✅ API response received:');
        console.log(`   Success: ${data.success}`);
        console.log(`   Provider: ${data.quote.provider || 'unknown'}`);
        console.log(`   Is Fallback: ${data.quote.isFallback || false}`);
        console.log(`   Price: ${data.quote.price.currency} ${data.quote.price.amount}`);
        console.log(`   Distance: ${(data.quote.distance.value / 1000).toFixed(1)} km`);
        console.log(`   ETA: ${new Date(data.quote.estimatedDeliveryTime).toLocaleTimeString()}`);
        
        if (data.quote.isFallback) {
            console.log('\n⚠️  Note: Using fallback provider due to Lalamove unavailability');
        }
        
        console.log('\n✅ API test completed successfully!');
        
    } catch (error) {
        console.error('❌ API test failed:', error.message);
        if (error.message.includes('fetch')) {
            console.log('\n💡 Make sure the dev server is running on localhost:3000');
            console.log('   Run: npm run dev');
        }
    }
}

// Wait a moment for any previous commands to complete
setTimeout(() => {
    testApiEndpoint();
}, 1000);