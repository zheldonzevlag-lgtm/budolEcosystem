require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const crypto = require('crypto');

// Minimal test - create order with minimum required fields only
async function testMinimalOrder() {
    console.log('========================================');
    console.log('  MINIMAL ORDER TEST (No Metadata)');
    console.log('========================================\n');

    const apiKey = process.env.LALAMOVE_CLIENT_ID;
    const apiSecret = process.env.LALAMOVE_CLIENT_SECRET;
    const baseUrl = 'https://rest.sandbox.lalamove.com';
    const market = 'PH';

    try {
        // Step 1: Get Quote
        console.log('📋 Getting Quote...');

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
        console.log('✅ Quote received');
        console.log('   Quotation ID:', quote.quotationId);
        console.log('   Stop IDs:', quote.stops[0].stopId, ',', quote.stops[1].stopId);

        // Step 2: Create Order - MINIMAL PAYLOAD
        console.log('\n📦 Creating Order with MINIMAL payload...');

        // Try the absolute minimum required fields
        const orderPayload = {
            data: {
                quotationId: quote.quotationId,
                sender: {
                    stopId: quote.stops[0].stopId,
                    name: 'John Doe',
                    phone: '+639171234567'
                },
                recipients: [
                    {
                        stopId: quote.stops[1].stopId,
                        name: 'Jane Smith',
                        phone: '+639177654321'
                    }
                ]
            }
        };

        console.log('\nOrder Payload (minimal):');
        console.log(JSON.stringify(orderPayload, null, 2));

        const orderTimestamp = new Date().getTime().toString();
        const orderBody = JSON.stringify(orderPayload);
        const orderRawSig = orderTimestamp + CRLF + 'POST' + CRLF + '/v3/orders' + CRLF + CRLF + orderBody;
        const orderSignature = crypto.createHmac('sha256', apiSecret).update(orderRawSig).digest('hex');

        console.log('\nSending request...');
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
        console.log('\n✅✅✅ ORDER CREATED SUCCESSFULLY! ✅✅✅');
        console.log('   Order ID:', order.orderId);
        console.log('   Status:', order.status);
        console.log('   Share Link:', order.shareLink);

        console.log('\n========================================');
        console.log('  🎉 SUCCESS! ORDER IN PARTNER PORTAL!');
        console.log('========================================');
        console.log('\n📊 Check Partner Portal:');
        console.log('   URL: http://partnerportal.lalamove.com/');
        console.log('   Order ID:', order.orderId);
        console.log('   Share Link:', order.shareLink);

    } catch (error) {
        console.error('\n❌ FAILED:');
        console.error('Message:', error.message);

        if (error.response) {
            console.error('\nHTTP Status:', error.response.status);
            console.error('\nResponse Data:');
            console.error(JSON.stringify(error.response.data, null, 2));

            if (error.response.data?.errors) {
                console.error('\nError Details:');
                error.response.data.errors.forEach(err => {
                    console.error('  -', err.id, ':', err.message);
                    if (err.detail) console.error('    Detail:', err.detail);
                });
            }
        }

        process.exit(1);
    }
}

testMinimalOrder();
