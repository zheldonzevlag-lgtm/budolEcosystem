const axios = require('axios');

async function testProcessQR() {
    const userId = 'a48aeedf-b60d-46c3-b350-6c8a4bd363ec'; // clark.kent's ID
    const qrData = {
        type: 'budolpay_payment',
        orderId: 'ORD-TEST-123',
        amount: 100, 
        merchant: 'budolShap',
        paymentIntentId: '56e5bacd-d010-4671-a99f-dab3f4690dd7'
    };

    try {
        console.log('Testing /process-qr endpoint...');
        const response = await axios.post('http://localhost:8002/process-qr', {
            userId,
            qrData
        });
        console.log('Success:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testProcessQR();
