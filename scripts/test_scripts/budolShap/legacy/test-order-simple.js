require('dotenv').config({ path: '.env.local' });
const { getShippingProvider } = require('../../services/shippingFactory');
const fs = require('fs');

async function testOrderCreation() {
    const logFile = 'test-order-creation-log.txt';
    const log = (msg) => {
        console.log(msg);
        fs.appendFileSync(logFile, msg + '\n');
    };

    // Clear log file
    fs.writeFileSync(logFile, '');

    log('========================================');
    log('  LALAMOVE ORDER CREATION TEST');
    log('========================================\n');

    try {
        const lalamove = getShippingProvider('lalamove');

        // Step 1: Get Quote
        log('📋 STEP 1: Getting Quote...');
        const quoteData = {
            serviceType: 'MOTORCYCLE',
            language: 'en_PH',
            stops: [
                {
                    coordinates: { lat: '14.5995', lng: '120.9842' },
                    address: 'Manila City Hall, Arroceros St, Ermita, Manila'
                },
                {
                    coordinates: { lat: '14.5547', lng: '121.0244' },
                    address: 'Makati City Hall, J.P. Rizal Ave, Poblacion, Makati'
                }
            ]
        };

        const quote = await lalamove.getQuote(quoteData);

        log('✅ Quote received:');
        log('   Quotation ID: ' + quote.quotationId);
        log('   Pickup Stop ID: ' + quote.stops[0].stopId);
        log('   Delivery Stop ID: ' + quote.stops[1].stopId);

        // Step 2: Create Order
        log('\n📦 STEP 2: Creating Order...');
        const orderData = {
            quotationId: quote.quotationId,
            stops: quote.stops,
            pickupContact: {
                name: 'Test Sender',
                phone: '+639171234567'
            },
            deliveryContact: {
                name: 'Test Recipient',
                phone: '+639177654321'
            },
            packageDetails: {
                remarks: 'TEST ORDER - Phase 5'
            },
            metadata: {
                platform: 'budolshap',
                test: true
            }
        };

        log('Attempting to create order...');
        const order = await lalamove.createOrder(orderData);

        log('\n✅ ORDER CREATED SUCCESSFULLY!');
        log('   Order ID: ' + order.orderId);
        log('   Status: ' + order.status);
        log('   Share Link: ' + order.shareLink);

        log('\n========================================');
        log('  ✅ TEST PASSED!');
        log('========================================');
        log('\nCheck Partner Portal: http://partnerportal.lalamove.com/');
        log('Look for order ID: ' + order.orderId);

    } catch (error) {
        log('\n❌ TEST FAILED:');
        log('Error Message: ' + error.message);
        log('Error Code: ' + error.code);

        if (error.originalError) {
            log('\nLalamove API Error:');
            log(JSON.stringify(error.originalError, null, 2));
        }

        if (error.response?.data) {
            log('\nAPI Response Data:');
            log(JSON.stringify(error.response.data, null, 2));
        }

        log('\nFull Error Stack:');
        log(error.stack);

        log('\n========================================');
        log('  ❌ TEST FAILED - See log above');
        log('========================================');

        console.log('\n📄 Full error details written to:', logFile);
        process.exit(1);
    }
}

testOrderCreation();
