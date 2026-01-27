// Test PayMongo Payment Intent Creation for Maya
require('dotenv').config({ path: '.env.local' });

async function testMayaPayment() {
    const secretKey = process.env.PAYMONGO_SECRET_KEY;

    if (!secretKey) {
        console.error('❌ PAYMONGO_SECRET_KEY not found in environment');
        return;
    }

    console.log('🔑 Using PayMongo Secret Key:', secretKey.substring(0, 10) + '...');

    const authHeader = `Basic ${Buffer.from(secretKey + ':').toString('base64')}`;
    const headers = {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: authHeader
    };

    try {
        // 1. Create Payment Intent
        console.log('\n📝 Step 1: Creating Payment Intent for Maya...');
        const intentBody = {
            data: {
                attributes: {
                    amount: 100000, // 1000 PHP in centavos
                    payment_method_allowed: ['paymaya'],
                    payment_method_options: {
                        card: { request_three_d_secure: 'any' }
                    },
                    currency: 'PHP',
                    description: 'Test Maya Payment',
                    capture_type: 'automatic'
                }
            }
        };

        const intentResp = await fetch('https://api.paymongo.com/v1/payment_intents', {
            method: 'POST',
            headers,
            body: JSON.stringify(intentBody)
        });

        const intentData = await intentResp.json();

        if (intentData.errors) {
            console.error('❌ Intent Creation Failed:', JSON.stringify(intentData.errors, null, 2));
            return;
        }

        console.log('✅ Payment Intent Created:', intentData.data.id);
        const paymentIntentId = intentData.data.id;

        // 2. Create Payment Method
        console.log('\n📝 Step 2: Creating Payment Method (Maya)...');
        const methodBody = {
            data: {
                attributes: {
                    type: 'paymaya',
                    billing: {
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
                    }
                }
            }
        };

        const methodResp = await fetch('https://api.paymongo.com/v1/payment_methods', {
            method: 'POST',
            headers,
            body: JSON.stringify(methodBody)
        });

        const methodData = await methodResp.json();

        if (methodData.errors) {
            console.error('❌ Method Creation Failed:', JSON.stringify(methodData.errors, null, 2));
            return;
        }

        console.log('✅ Payment Method Created:', methodData.data.id);
        const paymentMethodId = methodData.data.id;

        // 3. Attach Payment Method to Intent
        console.log('\n📝 Step 3: Attaching Payment Method to Intent...');
        const attachBody = {
            data: {
                attributes: {
                    payment_method: paymentMethodId,
                    return_url: 'http://localhost:3000/payment/return'
                }
            }
        };

        const attachResp = await fetch(`https://api.paymongo.com/v1/payment_intents/${paymentIntentId}/attach`, {
            method: 'POST',
            headers,
            body: JSON.stringify(attachBody)
        });

        const attachData = await attachResp.json();

        if (attachData.errors) {
            console.error('❌ Attach Failed:', JSON.stringify(attachData.errors, null, 2));
            return;
        }

        console.log('✅ Payment Method Attached');
        console.log('\n📊 Response Status:', attachData.data.attributes.status);
        console.log('📊 Next Action:', attachData.data.attributes.next_action);

        // 4. Extract Checkout URL
        const nextAction = attachData.data.attributes.next_action;
        if (nextAction && nextAction.type === 'redirect') {
            console.log('\n🎉 SUCCESS! Checkout URL:', nextAction.redirect.url);
        } else {
            console.log('\n⚠️ No redirect URL found');
            console.log('Full Attach Response:', JSON.stringify(attachData.data, null, 2));
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    }
}

testMayaPayment();
