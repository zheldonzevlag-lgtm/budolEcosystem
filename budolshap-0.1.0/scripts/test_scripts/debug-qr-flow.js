
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function run() {
    console.log('--- Debugging QR Flow ---');

    // 1. Create Order (Mock)
    const orderData = {
        userId: 'user_2ozv8kZ5yW3f2gS4hT1jX9l0n', // Replace with valid ID if fails, or mock
        addressId: 'addr_mock',
        orderItems: [{ productId: 'prod_1', quantity: 1 }],
        paymentMethod: 'QRPH',
        isCouponUsed: false
    };

    // Skip Order Creation (Auth required usually).
    // Let's go straight to Payment Init.
    // We need an orderId for linking. Mock one.
    const orderId = 'order_test_' + Date.now();

    console.log('1. Initiating Payment for Order:', orderId);

    try {
        const checkoutRes = await fetch(`${BASE_URL}/api/payment/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: 10000, // 100.00
                method: 'qrph',
                orderId: orderId,
                description: 'Debug Test',
                billing: {
                    name: 'Debug User',
                    email: 'debug@example.com'
                }
            })
        });

        if (!checkoutRes.ok) {
            console.error('Checkout Failed:', await checkoutRes.text());
            return;
        }

        const checkoutData = await checkoutRes.json();
        console.log('Checkout Response:', checkoutData);

        const intentId = checkoutData.paymentIntentId;
        if (!intentId) {
            console.error('No Intent ID returned!');
            return;
        }

        console.log('2. Checking Status for Intent:', intentId);

        // Poll status immediately
        const statusRes = await fetch(`${BASE_URL}/api/paymongo/status?intent_id=${intentId}`);
        const statusData = await statusRes.json();
        console.log('Status Response (Immediate):', statusData);

        if (statusData.status === 'succeeded') {
            console.error('CRITICAL: Status is SUCCEEDED immediately! This causes the false positive.');
        } else {
            console.log('Status is correct:', statusData.status);
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

run();
