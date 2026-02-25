import fetch from 'node-fetch';

async function testPaymentService() {
    console.log('🧪 Testing Payment Gateway Service (Direct)...');

    const payload = {
        amount: 54.00,
        currency: 'PHP',
        provider: 'internal', // budolPay
        description: 'Debug Direct Order',
        metadata: {
            orderId: 'debug-order-direct',
            app: 'budolShap'
        }
    };

    try {
        const response = await fetch('http://127.0.0.1:8004/create-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log(`Response Status: ${response.status}`);
        
        const contentType = response.headers.get('content-type');
        console.log(`Content-Type: ${contentType}`);

        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            console.log('✅ Payment Data Received:');
            console.log(JSON.stringify(data, null, 2));
        } else {
            const text = await response.text();
            console.log('❌ Non-JSON Response:', text.substring(0, 500));
        }

    } catch (error) {
        console.error('💥 Error:', error);
    }
}

testPaymentService();
