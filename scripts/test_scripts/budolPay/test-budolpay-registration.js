const axios = require('axios');

async function testBudolPayRegistration() {
    const GATEWAY_URL = 'http://localhost:8080';
    
    const testUser = {
        email: `test_pay_${Date.now()}@example.com`,
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: `09${Math.floor(Math.random() * 1000000000)}`,
        pin: '123456',
        deviceId: 'TEST_DEVICE_ID'
    };

    console.log('--- Testing BudolPay Registration via Gateway ---');
    console.log(`URL: ${GATEWAY_URL}/auth/register`);
    
    try {
        const response = await axios.post(`${GATEWAY_URL}/auth/register`, testUser, {
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.status === 201 || response.status === 200) {
            console.log('✅ Registration Successful!');
            console.log('Response:', JSON.stringify(response.data, null, 2));
        } else {
            console.error('❌ Registration Failed:', response.data);
        }
    } catch (error) {
        if (error.response) {
            console.error('❌ Registration Failed (Response):', error.response.data);
        } else {
            console.error('❌ Error connecting to Gateway:', error.message);
        }
    }
}

testBudolPayRegistration();