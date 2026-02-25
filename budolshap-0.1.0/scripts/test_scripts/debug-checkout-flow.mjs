import fetch from 'node-fetch';

async function testCheckout() {
    console.log('🧪 Testing BudolPay Checkout...');

    const payload = {
        amount: 5400, // 54.00 PHP in centavos
        method: 'budolpay', // Using budolpay
        provider: 'budolpay',
        description: 'Debug Order',
        billing: {
            name: 'Debug User',
            email: 'debug@budolshap.com',
            phone: '09123456789',
            address: {
                line1: '123 Debug St',
                city: 'Debug City',
                state: 'DC',
                postal_code: '1000',
                country: 'PH'
            }
        },
        orderId: 'debug-order-' + Date.now()
    };

    try {
        const response = await fetch('http://localhost:3000/api/payment/checkout', {
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

            if (data.qrCode) {
                console.log('🎉 QR Code is present!');
            } else {
                console.error('❌ QR Code is MISSING!');
            }
        } else {
            const text = await response.text();
            console.log('❌ Non-JSON Response:', text.substring(0, 500));
        }

    } catch (error) {
        console.error('💥 Error:', error);
    }
}

testCheckout();
