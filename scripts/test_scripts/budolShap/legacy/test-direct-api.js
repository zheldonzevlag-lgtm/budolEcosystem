require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const crypto = require('crypto');

// Test creating order directly with Lalamove API
async function testDirectAPI() {
    console.log('========================================');
    console.log('  DIRECT LALAMOVE API TEST');
    console.log('========================================\n');

    const apiKey = process.env.LALAMOVE_CLIENT_ID;
    const apiSecret = process.env.LALAMOVE_CLIENT_SECRET;
    const baseUrl = 'https://rest.sandbox.lalamove.com';
    const market = 'PH';

    console.log('API Key:', apiKey ? '***' + apiKey.slice(-4) : 'MISSING');
    console.log('Environment: sandbox');
    console.log('Market:', market);
    console.log('');

    try {
        // Step 1: Get Quote
        console.log('📋 STEP 1: Getting Quote...');

        const quotePayload = {
            data: {
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
            }
        };

        const quoteTimestamp = new Date().getTime().toString();
        const quoteBody = JSON.stringify(quotePayload);
        const CRLF = String.fromCharCode(13, 10);
        const quoteRawSig = quoteTimestamp + CRLF + 'POST' + CRLF + '/v3/quotations' + CRLF + CRLF + quoteBody;
        const quoteSignature = crypto.createHmac('sha256', apiSecret).update(quoteRawSig).digest('hex');

        const quoteResponse = await axios.post(`${baseUrl}/v3/quotations`, quotePayload, {
            headers: {
                'Authorization': `hmac ${apiKey}:${quoteTimestamp}:${quoteSignature}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Market': market,
                'Request-ID': crypto.randomUUID()
            }
        });

        const quote = quoteResponse.data.data;
        console.log('✅ Quote received:');
        console.log('   Quotation ID:', quote.quotationId);
        console.log('   Pickup Stop ID:', quote.stops[0].stopId);
        console.log('   Delivery Stop ID:', quote.stops[1].stopId);
        console.log('   Price:', quote.priceBreakdown.total, quote.priceBreakdown.currency);

        // Step 2: Create Order
        console.log('\n📦 STEP 2: Creating Order...');
        console.log('⚠️  This will create a REAL order!\n');

        const orderPayload = {
            data: {
                quotationId: quote.quotationId,
                sender: {
                    stopId: quote.stops[0].stopId,
                    name: 'Test Sender',
                    phone: '+639171234567'  // ✅ Correct: +63 + 10 digits
                },
                recipients: [
                    {
                        stopId: quote.stops[1].stopId,
                        name: 'Test Recipient',
                        phone: '+639177654321',  // ✅ Correct: +63 + 10 digits
                        remarks: 'TEST ORDER - Phase 5'
                    }
                ],
                isPODEnabled: false,
                metadata: {
                    platform: 'budolshap',
                    test: true
                }
            }
        };

        console.log('Order Payload:');
        console.log(JSON.stringify(orderPayload, null, 2));
        console.log('');

        const orderTimestamp = new Date().getTime().toString();
        const orderBody = JSON.stringify(orderPayload);
        const orderRawSig = orderTimestamp + CRLF + 'POST' + CRLF + '/v3/orders' + CRLF + CRLF + orderBody;
        const orderSignature = crypto.createHmac('sha256', apiSecret).update(orderRawSig).digest('hex');

        console.log('Making API request to /v3/orders...');
        const orderResponse = await axios.post(`${baseUrl}/v3/orders`, orderPayload, {
            headers: {
                'Authorization': `hmac ${apiKey}:${orderTimestamp}:${orderSignature}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Market': market,
                'Request-ID': crypto.randomUUID()
            }
        });

        const order = orderResponse.data.data;
        console.log('\n✅ ORDER CREATED SUCCESSFULLY!');
        console.log('   Order ID:', order.orderId);
        console.log('   Status:', order.status);
        console.log('   Share Link:', order.shareLink);
        console.log('   Price:', order.priceBreakdown.total, order.priceBreakdown.currency);

        console.log('\n========================================');
        console.log('  ✅ TEST PASSED!');
        console.log('========================================');
        console.log('\nCheck Partner Portal: http://partnerportal.lalamove.com/');
        console.log('Look for order ID:', order.orderId);

    } catch (error) {
        console.error('\n❌ TEST FAILED:');
        console.error('Error Message:', error.message);

        if (error.response) {
            console.error('\nHTTP Status:', error.response.status);
            console.error('Response Data:');
            console.error(JSON.stringify(error.response.data, null, 2));
        }

        console.error('\nFull Error:', error);
        process.exit(1);
    }
}

testDirectAPI();
