const fetch = require('node-fetch');

async function testWebhook() {
    console.log('🚀 Testing BudolPay Webhook...');

    // Mock Webhook Payload
    const payload = {
        event: 'payment.success',
        data: {
            id: 'pi_test_12345',
            amount: 150,
            currency: 'PHP',
            status: 'paid',
            metadata: {
                orderId: 'cmjtjgxqn0004gppshxpp62gx', // Current test order ID
                app: 'budolShap'
            }
        }
    };

    const webhookUrl = 'http://localhost:3000/api/webhooks/budolpay';

    try {
        console.log(`[Test] Sending payload to ${webhookUrl}...`);
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ Webhook Response:', result);
            console.log('Success! The webhook endpoint acknowledged the event.');
        } else {
            console.error('❌ Webhook Error:', result);
        }
    } catch (error) {
        console.error('❌ Test Failed:', error.message);
    }
}

testWebhook();
