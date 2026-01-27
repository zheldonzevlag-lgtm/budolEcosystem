async function testWebhook() {
    console.log('🚀 Testing BudolPay Webhook...');

    // Mock Webhook Payload
    const payload = {
        event: 'payment.success',
        data: {
            id: 'pi_ou68e',
            amount: 1.00,
            currency: 'PHP',
            status: 'paid',
            metadata: {
                orderId: 'cmjtjrb3e000egpps3ftqprfx', // Latest test order ID
                app: 'budolShap'
            }
        }
    };

    const webhookUrl = 'http://localhost:3001/api/webhooks/budolpay';

    try {
        console.log(`[Test] Sending payload to ${webhookUrl}...`);
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const text = await response.text();
        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            result = text;
        }

        if (response.ok) {
            console.log('✅ Webhook Response:', result);
            console.log('Success! The webhook endpoint acknowledged the event.');
        } else {
            console.error('❌ Webhook Error Status:', response.status);
            console.error('❌ Webhook Error Body:', result);
        }
    } catch (error) {
        console.error('❌ Test Failed:', error.message);
    }
}

testWebhook();
