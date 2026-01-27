const axios = require('axios');

async function testSuccessfulRegistration() {
    console.log('--- Testing Successful Registration (Unique Data) ---');
    const registerUrl = 'http://localhost:3000/api/auth/register';
    
    // Using a random email and phone to ensure uniqueness
    const randomSuffix = Math.floor(Math.random() * 1000000);
    const payload = {
        name: 'Test User ' + randomSuffix,
        email: `testuser${randomSuffix}@gmail.com`,
        password: 'password123',
        phoneNumber: '9' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0'),
        registrationType: 'standard'
    };

    console.log('Payload:', payload);

    try {
        const response = await axios.post(registerUrl, payload);
        console.log('Status Code:', response.status);
        console.log('Response Data:', response.data);
        
        if (response.status === 200 || response.status === 201) {
            console.log('✅ TEST PASSED: Registration successful.');
        } else {
            console.log('❌ TEST FAILED: Unexpected status code.');
        }
    } catch (error) {
        if (error.response) {
            console.log('Status Code:', error.response.status);
            console.log('Error Message:', error.response.data?.error);
            console.log('❌ TEST FAILED: Registration should have succeeded.');
        } else {
            console.log('Error without response:', error.message);
        }
    }
}

testSuccessfulRegistration();