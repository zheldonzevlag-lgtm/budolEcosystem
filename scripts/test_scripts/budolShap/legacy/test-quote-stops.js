require('dotenv').config({ path: '.env.local' });
const { getShippingProvider } = require('../../services/shippingFactory');

async function testQuoteWithStops() {
    console.log('========================================');
    console.log('  TEST: Quote Returns Stops with IDs');
    console.log('========================================\n');

    try {
        const lalamove = getShippingProvider('lalamove');

        console.log('📋 Step 1: Requesting quote...');
        const quoteData = {
            serviceType: 'MOTORCYCLE',
            language: 'en_PH',
            stops: [
                {
                    coordinates: {
                        lat: '14.5995',
                        lng: '120.9842'
                    },
                    address: 'Manila City Hall, Arroceros St, Ermita, Manila'
                },
                {
                    coordinates: {
                        lat: '14.5547',
                        lng: '121.0244'
                    },
                    address: 'Makati City Hall, J.P. Rizal Ave, Poblacion, Makati'
                }
            ]
        };

        const quote = await lalamove.getQuote(quoteData);

        console.log('\n✅ Quote received successfully!');
        console.log('   Quotation ID:', quote.quotationId);
        console.log('   Price:', quote.priceBreakdown.total, quote.priceBreakdown.currency);
        console.log('   Distance:', quote.distance.value, quote.distance.unit);
        console.log('   Expires at:', quote.expiresAt);

        // CRITICAL TEST: Check if stops array exists
        console.log('\n🔍 CRITICAL TEST: Checking stops array...');

        if (!quote.stops) {
            console.error('   ❌ FAILED: stops array is missing!');
            console.error('   Quote object keys:', Object.keys(quote));
            process.exit(1);
        }

        if (!Array.isArray(quote.stops)) {
            console.error('   ❌ FAILED: stops is not an array!');
            console.error('   stops type:', typeof quote.stops);
            process.exit(1);
        }

        if (quote.stops.length < 2) {
            console.error('   ❌ FAILED: stops array has less than 2 items!');
            console.error('   stops length:', quote.stops.length);
            process.exit(1);
        }

        console.log('   ✅ PASSED: stops array exists with', quote.stops.length, 'items');

        // Check stopIds
        console.log('\n🔍 CRITICAL TEST: Checking stopIds...');

        const pickupStopId = quote.stops[0]?.stopId;
        const deliveryStopId = quote.stops[1]?.stopId;

        if (!pickupStopId) {
            console.error('   ❌ FAILED: Pickup stopId is missing!');
            console.error('   stops[0]:', quote.stops[0]);
            process.exit(1);
        }

        if (!deliveryStopId) {
            console.error('   ❌ FAILED: Delivery stopId is missing!');
            console.error('   stops[1]:', quote.stops[1]);
            process.exit(1);
        }

        console.log('   ✅ PASSED: Both stopIds exist');
        console.log('   Pickup Stop ID:', pickupStopId);
        console.log('   Delivery Stop ID:', deliveryStopId);

        // Display full stops data
        console.log('\n📊 Complete Stops Data:');
        quote.stops.forEach((stop, index) => {
            console.log(`\n   Stop ${index}:`);
            console.log('     stopId:', stop.stopId);
            console.log('     address:', stop.address);
            console.log('     coordinates:', stop.coordinates);
        });

        console.log('\n========================================');
        console.log('  ✅ ALL TESTS PASSED!');
        console.log('========================================');
        console.log('\n✨ The quote now includes stops with stopIds.');
        console.log('✨ These stopIds can be used for order creation.');

    } catch (error) {
        console.error('\n❌ TEST FAILED with error:');
        console.error('   Message:', error.message);
        console.error('\n   Full error:', error);
        process.exit(1);
    }
}

testQuoteWithStops();
