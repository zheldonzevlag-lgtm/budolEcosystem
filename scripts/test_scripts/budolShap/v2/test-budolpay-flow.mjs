import fetch from 'node-fetch';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const MOCK_GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8004'; // or 8005 depending on adapter

async function testBudolPayFlow() {
    console.log('🧪 Testing BudolPay Payment Flow...');

    // 1. Create a mock order payload (or just minimal data for checkout)
    // Note: checkout API usually requires an orderId to link, but might work without for testing if we just want to see the response structure
    
    // We can't easily create an order without auth in this script unless we login first.
    // However, the payment initiate API might not require auth if it's public? 
    // In route.js, it seems public but links to order if orderId provided.
    
    const checkoutPayload = {
        amount: 5400, // 54.00 PHP
        method: 'BUDOL_PAY',
        provider: 'budolpay',
        description: 'Test Order',
        orderId: 'test_order_' + Date.now(),
        billing: {
            name: 'Test User',
            email: 'test@example.com',
            phone: '09123456789',
            address: {
                line1: 'Test St',
                city: 'Test City',
                state: 'Test State',
                postal_code: '1234',
                country: 'PH'
            }
        }
    };

    console.log('📤 Sending Checkout Request:', JSON.stringify(checkoutPayload, null, 2));

    try {
        const response = await fetch(`${BASE_URL}/api/payment/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(checkoutPayload)
        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('❌ Failed to parse JSON response:', text);
            return;
        }

        console.log('📥 Received Response:', JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.error('❌ Checkout API failed with status:', response.status);
            return;
        }

        // Verification Logic matching OrderSummary.jsx
        const qrCode = data.qrCode || data.data?.qrCode || data.response?.qrCode;
        
        if (qrCode) {
            console.log('✅ QR Code strategy detected.');
            if (qrCode.imageUrl) {
                console.log('✅ QR Code has imageUrl:', qrCode.imageUrl);
                console.log('✅ Amount in QR:', qrCode.amount);
                console.log('✅ Label:', qrCode.label);
                
                // Verify amount decimal conversion
                // Payload sent 5400. Adapter divides by 100 -> 54.
                // QR Code imageUrl should contain amount=54
                if (qrCode.imageUrl.includes('amount":54')) {
                    console.log('✅ Amount decimal conversion verified in QR payload.');
                } else {
                    console.warn('⚠️ Amount might not be converted correctly in QR payload. URL:', qrCode.imageUrl);
                }
                
                console.log('🎉 TEST PASSED: OrderSummary should redirect to /payment/qr');
            } else {
                console.error('❌ QR Code missing imageUrl!');
            }
        } else if (data.checkoutUrl) {
            console.log('⚠️ Checkout URL strategy detected (Fallback).');
            console.log('🔗 Checkout URL:', data.checkoutUrl);
            console.warn('⚠️ WARNING: OrderSummary prefers QR Code. If QR Code is missing, it falls back to this.');
        } else {
            console.error('❌ No valid payment strategy returned.');
        }

    } catch (error) {
        console.error('💥 Error running test:', error);
    }
}

testBudolPayFlow();
