require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');

async function debugOrderCreation() {
    const logFile = 'lalamove-debug-log.txt';
    const log = (msg) => {
        console.log(msg);
        fs.appendFileSync(logFile, msg + '\n');
    };

    fs.writeFileSync(logFile, '=== LALAMOVE ORDER CREATION DEBUG ===\n');
    fs.appendFileSync(logFile, new Date().toISOString() + '\n\n');

    const apiKey = process.env.LALAMOVE_CLIENT_ID;
    const apiSecret = process.env.LALAMOVE_CLIENT_SECRET;
    const baseUrl = 'https://rest.sandbox.lalamove.com';
    const market = 'PH';

    log('Environment Check:');
    log('  API Key: ' + (apiKey ? '***' + apiKey.slice(-4) : 'MISSING'));
    log('  API Secret: ' + (apiSecret ? 'PRESENT' : 'MISSING'));
    log('  Base URL: ' + baseUrl);
    log('  Market: ' + market);
    log('');

    try {
        // Step 1: Get Quote
        log('STEP 1: Getting Quote...');

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
        log('✅ Quote Success');
        log('  Quotation ID: ' + quote.quotationId);
        log('  Stop 0 ID: ' + quote.stops[0].stopId);
        log('  Stop 1 ID: ' + quote.stops[1].stopId);
        log('  Price: ' + quote.priceBreakdown.total + ' ' + quote.priceBreakdown.currency);
        log('');

        // Step 2: Create Order - Try WITHOUT isPODEnabled and metadata
        log('STEP 2: Creating Order (absolute minimum fields)...');

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

        log('Order Payload:');
        log(JSON.stringify(orderPayload, null, 2));
        log('');

        const orderTimestamp = new Date().getTime().toString();
        const orderBody = JSON.stringify(orderPayload);
        const orderRawSig = orderTimestamp + CRLF + 'POST' + CRLF + '/v3/orders' + CRLF + CRLF + orderBody;
        const orderSignature = crypto.createHmac('sha256', apiSecret).update(orderRawSig).digest('hex');

        const requestId = crypto.randomUUID();
        log('Request Details:');
        log('  Timestamp: ' + orderTimestamp);
        log('  Request-ID: ' + requestId);
        log('  Signature: ' + orderSignature.substring(0, 20) + '...');
        log('');

        log('Sending request to Lalamove...');
        const orderResponse = await axios.post(`${baseUrl}/v3/orders`, orderPayload, {
            headers: {
                'Authorization': `hmac ${apiKey}:${orderTimestamp}:${orderSignature}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Market': market,
                'Request-ID': requestId
            }
        });

        const order = orderResponse.data.data;
        log('');
        log('========================================');
        log('✅✅✅ ORDER CREATED SUCCESSFULLY! ✅✅✅');
        log('========================================');
        log('');
        log('Order Details:');
        log('  Order ID: ' + order.orderId);
        log('  Status: ' + order.status);
        log('  Share Link: ' + order.shareLink);
        log('  Price: ' + order.priceBreakdown.total + ' ' + order.priceBreakdown.currency);
        log('');
        log('Full Response:');
        log(JSON.stringify(order, null, 2));
        log('');
        log('========================================');
        log('NEXT STEPS:');
        log('========================================');
        log('1. Check Partner Portal: http://partnerportal.lalamove.com/');
        log('2. Switch to Sandbox view');
        log('3. Look for Order ID: ' + order.orderId);
        log('4. Verify order details match');
        log('');
        log('📄 Full log saved to: ' + logFile);

    } catch (error) {
        log('');
        log('========================================');
        log('❌ ERROR OCCURRED');
        log('========================================');
        log('');
        log('Error Message: ' + error.message);
        log('');

        if (error.response) {
            log('HTTP Status: ' + error.response.status);
            log('Status Text: ' + error.response.statusText);
            log('');
            log('Response Headers:');
            log(JSON.stringify(error.response.headers, null, 2));
            log('');
            log('Response Data:');
            log(JSON.stringify(error.response.data, null, 2));
            log('');

            if (error.response.data?.errors) {
                log('Detailed Errors:');
                error.response.data.errors.forEach((err, index) => {
                    log(`  Error ${index + 1}:`);
                    log('    ID: ' + err.id);
                    log('    Message: ' + err.message);
                    if (err.detail) log('    Detail: ' + err.detail);
                });
            }
        } else if (error.request) {
            log('No response received from server');
            log('Request details:');
            log(JSON.stringify(error.request, null, 2));
        } else {
            log('Error setting up request:');
            log(error.stack);
        }

        log('');
        log('📄 Full error log saved to: ' + logFile);

        process.exit(1);
    }
}

debugOrderCreation();
