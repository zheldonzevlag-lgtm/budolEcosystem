const axios = require('axios');

async function testRegistrationFailure() {
    console.log('--- Testing Registration Failure (Duplicate Phone) ---');
    const registerUrl = 'http://localhost:3000/api/auth/register';
    
    const payload = {
        name: 'Steve Rogers',
        email: 'zheldonzevlag@gmail.com',
        password: 'password123',
        phoneNumber: '9484099300', // This is the duplicate phone
        registrationType: 'standard'
    };

    try {
        const response = await axios.post(registerUrl, payload);
        console.log('Unexpected success:', response.data);
    } catch (error) {
        if (error.response) {
            console.log('Status Code:', error.response.status);
            console.log('Error Message:', error.response.data?.error);
            
            if (error.response.data?.error === 'This phone number is already registered') {
                console.log('✅ TEST PASSED: Specific error message received.');
            } else {
                console.log('❌ TEST FAILED: Expected specific error message. Got:', error.response.data?.error);
            }
        } else {
            console.log('Error without response:', error.message);
            if (error.code) console.log('Error code:', error.code);
        }
    }
}

testRegistrationFailure();
