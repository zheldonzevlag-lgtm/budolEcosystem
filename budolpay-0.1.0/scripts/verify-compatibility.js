const axios = require('axios');

async function verifyCompatibility() {
    console.log('--- Verifying Payment Gateway Compatibility ---');
    try {
        const response = await axios.post('http://localhost:8004/payments/create-intent', {
            amount: 150,
            currency: 'PHP',
            description: 'Compatibility Test',
            metadata: { app: 'budolShap', orderId: 'COMPAT-TEST-1' }
        });

        console.log('Gateway Response Keys:', Object.keys(response.data));
        
        const { id, paymentIntentId, referenceId } = response.data;
        console.log('ID:', id);
        console.log('PaymentIntentId:', paymentIntentId);
        console.log('ReferenceId:', referenceId);

        if (id && paymentIntentId && referenceId) {
            console.log('✅ COMPATIBILITY CHECK PASSED: Required ID fields are present.');
        } else {
            console.error('❌ COMPATIBILITY CHECK FAILED: Missing required ID fields.');
            return;
        }

        // Now test Wallet Service /process-qr with referenceId (simulating app behavior)
        console.log('\n--- Testing Wallet Service with ReferenceId ---');
        const walletResponse = await axios.post('http://localhost:8002/process-qr', {
            userId: 'a48aeedf-b60d-46c3-b350-6c8a4bd363ec', // Clark Kent
            qrData: {
                type: 'budolpay_payment',
                orderId: 'COMPAT-TEST-1',
                amount: 150,
                merchant: 'budolShap',
                paymentIntentId: referenceId // Testing referenceId lookup
            }
        });

        console.log('Wallet Response:', walletResponse.data);
        if (walletResponse.data.success) {
            console.log('✅ WALLET SERVICE REFERENCE LOOKUP PASSED.');
        }

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

verifyCompatibility();
