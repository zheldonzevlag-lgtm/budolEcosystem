
const fetch = require('node-fetch');

async function testOrderPlacement() {
    const baseUrl = 'http://localhost:3001'; // budolShap
    const orderData = {
        userId: 'clpxxxxxxxx', // Needs a valid user ID from DB
        items: [
            { id: 'prod1', name: 'Test Product', price: 100, quantity: 1 }
        ],
        total: 100,
        shippingAddress: {
            street: '123 Test St',
            city: 'Manila',
            state: 'NCR',
            zip: '1000',
            phone: '09123456789'
        },
        paymentMethod: 'BUDOL_PAY'
    };

    console.log('🚀 Testing Order Placement API...');
    
    try {
        // 1. Create Order
        console.log('\nStep 1: Creating Order...');
        const orderResponse = await fetch(`${baseUrl}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        const orderResult = await orderResponse.json();
        if (!orderResponse.ok) {
            console.error('❌ Order Creation Failed:', orderResult);
            return;
        }
        console.log('✅ Order Created:', orderResult.id);
        const orderId = orderResult.id;

        // 2. Initiate Payment
        console.log('\nStep 2: Initiating Payment (BudolPay)...');
        const paymentResponse = await fetch(`${baseUrl}/api/payment/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: 10000, // 100 PHP in centavos
                orderId: orderId,
                method: 'budolpay',
                provider: 'budolpay',
                description: `Order #${orderId}`,
                billing: {
                    name: 'Test User',
                    email: 'test@example.com',
                    phone: '09123456789',
                    address: {
                        line1: '123 Test St',
                        city: 'Manila',
                        state: 'NCR',
                        postal_code: '1000',
                        country: 'PH'
                    }
                }
            })
        });

        const contentType = paymentResponse.headers.get('content-type');
        console.log('Response Content-Type:', contentType);

        const paymentText = await paymentResponse.text();
        try {
            const paymentData = JSON.parse(paymentText);
            console.log('✅ Payment Initiated:', paymentData);
        } catch (e) {
            console.error('❌ Failed to parse payment response as JSON.');
            console.error('Raw Response:', paymentText.slice(0, 500));
        }

    } catch (error) {
        console.error('💥 Test Error:', error);
    }
}

testOrderPlacement();
