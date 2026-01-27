import axios from 'axios';

const LOCAL_IP = 'localhost'; // Use localhost for local testing
const GATEWAY_URL = `http://${LOCAL_IP}:8004`;
const WALLET_SERVICE_URL = `http://${LOCAL_IP}:8002`;
const BUDOLSHAP_URL = `http://${LOCAL_IP}:3001`;

async function runTest() {
  console.log('🚀 Starting Cross-Platform Sync End-to-End Test...');

  try {
    // 1. Create Payment Intent from budolShap
    console.log('\nStep 1: Creating Payment Intent...');
    const intentResponse = await axios.post(`${GATEWAY_URL}/create-intent`, {
        amount: 150.00,
        currency: 'PHP',
        description: 'Test Order #12345',
        provider: 'budolpay',
        metadata: {
          app: 'budolShap',
          orderId: 'test-order-12345',
          storeName: 'Test Merchant'
        }
      });

    const { paymentIntentId, referenceId, qrCode } = intentResponse.data;
    console.log(`✅ Intent Created. ID: ${paymentIntentId}, Ref: ${referenceId}`);

    // 2. Simulate Mobile App Processing QR
            console.log('\nStep 2: Simulating Mobile App processing QR...');
            console.log('Raw qrCode field:', intentResponse.data.qrCode);
            const qrData = JSON.parse(intentResponse.data.qrCode);
            console.log('Parsed qrData:', qrData);
    
    // Simulation Constants (Replace with values from generate_test_token.mjs)
    const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkODdjYTNhYy1mYzIwLTRhZjktYWViMS0yMjllOWY3MGIwNmMiLCJyb2xlIjoiVVNFUiIsInR5cGUiOiJNT0JJTEUiLCJpYXQiOjE3NjkzMzk4ODUsImV4cCI6MTc2OTM0MzQ4NX0.R6D3sjoxQSL5jSxyeqt5dzW5q3o96poryWB8NElM-CM';
    const TEST_USER_ID = 'd87ca3ac-fc20-4af9-aeb1-229e9f70b06c';
    
    const walletResponse = await axios.post(`${WALLET_SERVICE_URL}/process-qr`, {
        userId: TEST_USER_ID,
        qrData: qrData
      }, {
          headers: {
              'Authorization': `Bearer ${TEST_TOKEN}`
          }
      });

    console.log(`✅ Wallet Processed. Status: ${walletResponse.data.status}`);

    // 3. Verify Transaction Status in Gateway
    console.log('\nStep 3: Verifying Transaction Status in Gateway...');
    const statusResponse = await axios.get(`${GATEWAY_URL}/status/${referenceId}`);
    console.log(`✅ Gateway Status: ${statusResponse.data.status}`);

    if (statusResponse.data.status === 'COMPLETED') {
      console.log('\n✨ SUCCESS: Cross-platform sync flow verified!');
    } else {
      console.log('\n❌ FAILURE: Transaction status mismatch.');
    }

  } catch (error) {
    console.error('\n❌ Test Failed:', error.response?.data || error.message);
  }
}

runTest();
