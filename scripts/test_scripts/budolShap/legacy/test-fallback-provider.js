// Test the fallback shipping provider
const shippingFactory = require('../../services/shippingFactory');

async function testFallbackProvider() {
    console.log('Testing Fallback Shipping Provider...\n');
    
    try {
        // Get fallback provider
        const fallbackProvider = shippingFactory.getProvider('fallback');
        console.log('✅ Fallback provider initialized');
        
        // Test quote calculation
        const testPayload = {
            serviceType: 'MOTORCYCLE',
            stops: [
                {
                    coordinates: { lat: '14.5505', lng: '121.0260' }, // Glorietta, Makati
                    address: 'Glorietta 4, Ayala Center, Makati, Metro Manila'
                },
                {
                    coordinates: { lat: '14.6760', lng: '121.0437' }, // Quezon City
                    address: 'Quezon City, Metro Manila'
                }
            ],
            language: 'en_PH'
        };
        
        console.log('📍 Test route: Makati to Quezon City');
        console.log('🚛 Service type: MOTORCYCLE');
        
        const quote = await fallbackProvider.getQuote(testPayload);
        
        console.log('\n✅ Fallback quote generated:');
        console.log(`   Quote ID: ${quote.quotationId}`);
        console.log(`   Service: ${quote.serviceType}`);
        console.log(`   Distance: ${(quote.distance.value / 1000).toFixed(1)} km`);
        console.log(`   Price: PHP ${quote.priceBreakdown.total}`);
        console.log(`   Breakdown: Base PHP ${quote.priceBreakdown.base} + Surcharge PHP ${quote.priceBreakdown.surcharge}`);
        console.log(`   Pickup: ${new Date(quote.estimatedPickupTime).toLocaleTimeString()}`);
        console.log(`   Delivery: ${new Date(quote.estimatedDeliveryTime).toLocaleTimeString()}`);
        console.log(`   Is Fallback: ${quote.isFallback}`);
        
        // Test with different service types
        console.log('\n📋 Testing different service types...');
        const serviceTypes = ['MOTORCYCLE', 'CAR', 'VAN'];
        
        for (const serviceType of serviceTypes) {
            const testPayload2 = { ...testPayload, serviceType };
            const quote2 = await fallbackProvider.getQuote(testPayload2);
            console.log(`   ${serviceType}: PHP ${quote2.priceBreakdown.total}`);
        }
        
        console.log('\n✅ All tests passed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run test
testFallbackProvider();