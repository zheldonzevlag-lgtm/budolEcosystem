// Test the shipping service with fallback
const { getShippingQuote } = require('../../lib/services/shippingService');

async function testShippingServiceWithFallback() {
    console.log('Testing Shipping Service with Fallback...\n');
    
    try {
        // Test data (same as what LalamoveWidget would send)
        const testQuoteData = {
            pickup: {
                address: "Glorietta 4, Ayala Center, Makati, Metro Manila",
                coordinates: { lat: 14.5505, lng: 121.0260 }
            },
            delivery: {
                address: "Quezon City, Metro Manila",
                coordinates: { lat: 14.6760, lng: 121.0437 }
            },
            package: {
                weight: 2.5, // kg
                description: "Test package"
            },
            serviceType: 'MOTORCYCLE',
            provider: 'lalamove'
        };
        
        console.log('🧪 Testing quote request with Lalamove (may fail due to sandbox issues)...');
        
        const result = await getShippingQuote(testQuoteData);
        
        console.log('\n✅ Quote generated successfully:');
        console.log(`   Provider: ${result.quote.provider || 'lalamove'}`);
        console.log(`   Is Fallback: ${result.quote.isFallback || false}`);
        console.log(`   Price: ${result.quote.price.currency} ${result.quote.price.amount}`);
        console.log(`   Distance: ${(result.quote.distance.value / 1000).toFixed(1)} km`);
        console.log(`   ETA: ${new Date(result.quote.estimatedDeliveryTime).toLocaleTimeString()}`);
        
        if (result.quote.isFallback) {
            console.log('\n⚠️  Note: Using fallback provider due to Lalamove unavailability');
        }
        
        console.log('\n✅ Integration test passed!');
        
    } catch (error) {
        console.error('❌ Integration test failed:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Run test
testShippingServiceWithFallback();