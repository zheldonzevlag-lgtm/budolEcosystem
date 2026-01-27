const fetch = require('node-fetch');

async function testRegistration() {
    const BUDOLID_URL = 'http://localhost:8000';
    
    const testUser = {
        email: `test_reg_${Date.now()}@example.com`,
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: `09${Math.floor(Math.random() * 1000000000)}`
    };

    console.log('--- Testing budolID Registration Endpoint ---');
    try {
        const response = await fetch(`${BUDOLID_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Registration Successful!');
            console.log('Response:', JSON.stringify(data, null, 2));
        } else {
            console.error('❌ Registration Failed:', data);
        }
    } catch (error) {
        console.error('❌ Error connecting to budolID:', error.message);
    }
}

testRegistration();
