const axios = require('axios');

async function simulatePayment() {
    const TRANSACTION_ID = '89d139f7-0fcc-49e3-a01a-535f1d233999'; // Latest pending transaction
    const USER_ID = 'a48aeedf-b60d-46c3-b350-6c8a4bd363ec'; // Actual user ID
    const AMOUNT = 150;
    const REFERENCE_ID = 'JON-1767391921759-KTP8';

    console.log('🚀 Simulating full payment flow...');

    try {
        // 1. Get the actual user ID for Clark Kent
        console.log('[Step 1] Finding test user...');
        
        // 2. Call Wallet Service to process QR
        console.log(`[Step 2] Calling Wallet Service to process payment for Transaction: ${TRANSACTION_ID}...`);
        const walletResponse = await axios.post('http://localhost:8002/process-qr', {
            userId: USER_ID,
            qrData: {
                paymentIntentId: TRANSACTION_ID,
                amount: AMOUNT
            }
        });

        console.log('✅ Wallet Service Response:', walletResponse.data);

        // 3. Verify Transaction Status in Payment Gateway
        console.log(`[Step 3] Verifying status in Payment Gateway...`);
        const statusResponse = await axios.get(`http://localhost:8004/payments/status/${REFERENCE_ID}`);
        console.log('✅ Payment Gateway Status:', statusResponse.data);

        if (statusResponse.data.status === 'COMPLETED') {
            console.log('🎉 FULL FLOW SUCCESSFUL!');
        } else {
            console.error('❌ Status is still:', statusResponse.data.status);
        }

    } catch (error) {
        console.error('❌ Simulation Failed:', error.response?.data || error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

simulatePayment();
