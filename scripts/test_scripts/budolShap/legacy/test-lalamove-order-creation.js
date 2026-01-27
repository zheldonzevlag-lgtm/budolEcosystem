require('dotenv').config({ path: '.env.local' });
const { getShippingProvider } = require('../../services/shippingFactory');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'lalamove-test-log.txt');

function log(message, ...args) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${message} ${args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ')}\n`;
    console.log(message, ...args);
    fs.appendFileSync(LOG_FILE, formattedMessage);
}

function error(message, ...args) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ERROR: ${message} ${args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ')}\n`;
    console.error(message, ...args);
    fs.appendFileSync(LOG_FILE, formattedMessage);
}

// Clear log file
fs.writeFileSync(LOG_FILE, '');

async function testCompleteOrderFlow() {
    log('========================================');
    log('  LALAMOVE COMPLETE ORDER FLOW TEST');
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

        log('✅ Quote received:');
        log('   Quotation ID:', quote.quotationId);
        log('   Price:', quote.priceBreakdown.total, quote.priceBreakdown.currency);
        log('   Distance:', quote.distance.value, quote.distance.unit);
        log('   Expires at:', quote.expiresAt);

        // Verify stops
        log('\n🔍 Verifying Stop IDs:');
        if (quote.stops && quote.stops.length >= 2) {
            log('   ✅ Pickup Stop ID:', quote.stops[0].stopId);
            log('   ✅ Delivery Stop ID:', quote.stops[1].stopId);
        } else {
            error('   ❌ ERROR: Stops not found in quote response!');
            process.exit(1);
        }

        // Step 2: Create Order
        log('\n📦 STEP 2: Creating Order...');
        log('⚠️  WARNING: This will create a REAL order in Lalamove!');
        log('⚠️  Make sure you have sufficient credit in your wallet.');
        log('⚠️  You may need to cancel this test order afterwards.\n');

        const orderData = {
            quotationId: quote.quotationId,
            stops: quote.stops,  // ✅ Pass stops from quote
            pickupContact: {
                name: 'Test Sender',
                phone: '+639171234567'  // Replace with valid PH number if needed
            },
            deliveryContact: {
                name: 'Test Recipient',
                phone: '+639177654321'  // Replace with valid PH number if needed
            },
            packageDetails: {
                remarks: 'TEST ORDER - Budolshap Platform Integration Test - Phase 5'
            },
            metadata: {
                platform: 'budolshap',
                test: 'true',
                phase: 'phase5',
                timestamp: new Date().toISOString()
            }
        };

        log('Creating order with payload:');
        log('   Quotation ID:', orderData.quotationId);
        log('   Pickup Stop ID:', orderData.stops[0].stopId);
        log('   Delivery Stop ID:', orderData.stops[1].stopId);
        log('   Pickup Contact:', orderData.pickupContact.name);
        log('   Delivery Contact:', orderData.deliveryContact.name);

        const order = await lalamove.createOrder(orderData);

        log('\n✅ Order created successfully!');
        log('   Order ID:', order.orderId);
        log('   Status:', order.status);
        log('   Share Link:', order.shareLink);
        log('   Price:', order.priceBreakdown.total, order.priceBreakdown.currency);

        // Step 3: Track Order
        log('\n🔍 STEP 3: Tracking Order...');
        const tracking = await lalamove.trackOrder(order.orderId);

        log('✅ Tracking info:');
        log('   Status:', tracking.status);
        if (tracking.driver) {
            log('   Driver:', tracking.driver.name);
            log('   Phone:', tracking.driver.phone);
        } else {
            log('   Driver: Not assigned yet (status:', tracking.status, ')');
        }

        // Summary
        log('\n========================================');
        log('  ✅ TEST COMPLETE!');
        log('========================================');
        log('\n📊 NEXT STEPS:');
        log('1. Check Partner Portal: http://partnerportal.lalamove.com/');
        log('2. Verify order appears with ID:', order.orderId);
        log('3. Check order details match');
        log('4. Test tracking link:', order.shareLink);
        log('\n⚠️  IMPORTANT: Remember to cancel test order if needed!');
        log('   You can cancel within 5 minutes of driver assignment.');

        log('\n✨ SUCCESS: Orders are now being created with correct stopIds!');
        log('✨ Orders should appear in your Lalamove Partner Portal.');

    } catch (err) {
        error('\n❌ TEST FAILED:');
        error('   Message:', err.message);

        if (err.originalError) {
            error('\n   Lalamove API Error Details:');
            error(JSON.stringify(err.originalError, null, 2));
        }

        if (err.response?.data) {
            error('\n   Lalamove API Response:');
            error(JSON.stringify(err.response.data, null, 2));
        }

        if (err.code === 'ERR_INSUFFICIENT_CREDIT') {
            error('\n💡 TIP: Top up your Lalamove wallet in the Partner Portal');
        }

        error('\n   Stack:', err.stack);
        process.exit(1);
    }
}

testCompleteOrderFlow();
