// Comprehensive QRPh Payment Test with Full Logging
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const logFile = 'qrph-payment-test-log.txt';
const logs = [];

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    logs.push(logMessage);
}

async function testQRPhPayment() {
    try {
        log('🚀 Starting QRPh Payment Test');
        log('='.repeat(80));

        const secretKey = process.env.PAYMONGO_SECRET_KEY;

        if (!secretKey) {
            log('❌ PAYMONGO_SECRET_KEY not found in environment');
            return;
        }

        log(`🔑 Using PayMongo Secret Key: ${secretKey.substring(0, 15)}...`);

        const authHeader = `Basic ${Buffer.from(secretKey + ':').toString('base64')}`;
        const headers = {
            accept: 'application/json',
            'content-type': 'application/json',
            authorization: authHeader
        };

        // Test amount: 1000 PHP
        const amount = 100000; // in centavos
        const billing = {
            name: 'Peter Parker',
            email: 'peter.parker@budolshap.com',
            phone: '09171234567',
            address: {
                line1: '432 Wack-Wack',
                city: 'Mandaluyong',
                state: 'NCR',
                postal_code: '1550',
                country: 'PH'
            }
        };

        // STEP 1: Create Payment Intent
        log('');
        log('📝 STEP 1: Creating Payment Intent for QRPh');
        log('-'.repeat(80));

        const intentBody = {
            data: {
                attributes: {
                    amount: amount,
                    payment_method_allowed: ['qrph'],
                    payment_method_options: {
                        card: { request_three_d_secure: 'any' }
                    },
                    currency: 'PHP',
                    description: 'Test QRPh Payment - Order #TEST123',
                    capture_type: 'automatic',
                    metadata: {
                        customer_name: billing.name,
                        customer_email: billing.email,
                        customer_phone: billing.phone
                    }
                }
            }
        };

        log('Request Body:');
        log(JSON.stringify(intentBody, null, 2));

        const intentResp = await fetch('https://api.paymongo.com/v1/payment_intents', {
            method: 'POST',
            headers,
            body: JSON.stringify(intentBody)
        });

        const intentData = await intentResp.json();

        if (intentData.errors) {
            log('❌ Intent Creation Failed!');
            log('Errors:');
            log(JSON.stringify(intentData.errors, null, 2));
            return;
        }

        log('✅ Payment Intent Created Successfully');
        log(`Intent ID: ${intentData.data.id}`);
        log(`Status: ${intentData.data.attributes.status}`);
        const paymentIntentId = intentData.data.id;

        // STEP 2: Create Payment Method
        log('');
        log('📝 STEP 2: Creating Payment Method (QRPh)');
        log('-'.repeat(80));

        const methodBody = {
            data: {
                attributes: {
                    type: 'qrph',
                    billing: billing
                }
            }
        };

        log('Request Body:');
        log(JSON.stringify(methodBody, null, 2));

        const methodResp = await fetch('https://api.paymongo.com/v1/payment_methods', {
            method: 'POST',
            headers,
            body: JSON.stringify(methodBody)
        });

        const methodData = await methodResp.json();

        if (methodData.errors) {
            log('❌ Method Creation Failed!');
            log('Errors:');
            log(JSON.stringify(methodData.errors, null, 2));
            return;
        }

        log('✅ Payment Method Created Successfully');
        log(`Method ID: ${methodData.data.id}`);
        log(`Type: ${methodData.data.attributes.type}`);
        const paymentMethodId = methodData.data.id;

        // STEP 3: Attach Payment Method to Intent
        log('');
        log('📝 STEP 3: Attaching Payment Method to Intent');
        log('-'.repeat(80));

        const returnUrl = 'http://localhost:3000/payment/return';
        const attachBody = {
            data: {
                attributes: {
                    payment_method: paymentMethodId,
                    return_url: returnUrl
                }
            }
        };

        log('Request Body:');
        log(JSON.stringify(attachBody, null, 2));

        const attachResp = await fetch(`https://api.paymongo.com/v1/payment_intents/${paymentIntentId}/attach`, {
            method: 'POST',
            headers,
            body: JSON.stringify(attachBody)
        });

        const attachData = await attachResp.json();

        if (attachData.errors) {
            log('❌ Attach Failed!');
            log('Errors:');
            log(JSON.stringify(attachData.errors, null, 2));
            return;
        }

        log('✅ Payment Method Attached Successfully');
        log('');
        log('📊 ATTACH RESPONSE ANALYSIS');
        log('='.repeat(80));
        log(`Status: ${attachData.data.attributes.status}`);
        log(`Payment Intent ID: ${attachData.data.id}`);

        const nextAction = attachData.data.attributes.next_action;
        log('');
        log('Next Action Object:');
        log(JSON.stringify(nextAction, null, 2));

        // STEP 4: Extract Checkout URL
        log('');
        log('📝 STEP 4: Extracting Checkout URL');
        log('-'.repeat(80));

        let checkoutUrl = null;

        if (nextAction && nextAction.type === 'redirect') {
            checkoutUrl = nextAction.redirect.url;
            log('✅ Redirect URL Found!');
            log(`Type: ${nextAction.type}`);
            log(`Checkout URL: ${checkoutUrl}`);
            log(`Return URL: ${nextAction.redirect.return_url}`);
        } else if (attachData.data.attributes.status === 'succeeded') {
            checkoutUrl = returnUrl;
            log('⚠️ Payment Already Succeeded (unusual for async methods)');
            log(`Using return URL as checkout: ${checkoutUrl}`);
        } else {
            log('❌ No Redirect URL Found!');
            log('Full Attach Response:');
            log(JSON.stringify(attachData.data, null, 2));
        }

        // FINAL RESULT
        log('');
        log('🎯 FINAL RESULT');
        log('='.repeat(80));

        const result = {
            checkoutUrl: checkoutUrl,
            paymentIntentId: paymentIntentId,
            status: attachData.data.attributes.status,
            hasCheckoutUrl: !!checkoutUrl
        };

        log('Result Object (what would be returned to frontend):');
        log(JSON.stringify(result, null, 2));

        if (checkoutUrl) {
            log('');
            log('🎉 SUCCESS! Payment flow can proceed.');
            log(`User should be redirected to: ${checkoutUrl}`);
        } else {
            log('');
            log('⚠️ FAILURE! No checkout URL available.');
            log('Payment cannot proceed.');
        }

    } catch (error) {
        log('');
        log('❌ FATAL ERROR');
        log('='.repeat(80));
        log(`Error Message: ${error.message}`);
        log(`Error Stack: ${error.stack}`);
    } finally {
        // Write all logs to file
        fs.writeFileSync(logFile, logs.join('\n'), 'utf8');
        log('');
        log(`📄 Full log saved to: ${logFile}`);
    }
}

testQRPhPayment();
