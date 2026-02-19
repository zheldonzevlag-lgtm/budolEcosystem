// Configuration
const AUTH_SERVICE_URL = 'http://localhost:8001';

// Helper to generate random string
const randomString = (length) => Math.random().toString(36).substring(2, 2 + length);
const randomPhone = () => '09' + Math.floor(100000000 + Math.random() * 900000000).toString();

async function testRegistration() {
    console.log('--- Starting Registration Verification (v3.4.3) ---');

    const payload = {
        firstName: `TestUser_${randomString(5)}`,
        lastName: `TestLast_${randomString(5)}`,
        email: `test.${randomString(8)}@example.com`,
        password: 'Password123!',
        phoneNumber: randomPhone(),
        pin: '123456',
        deviceId: `device_${randomString(10)}`
    };

    console.log('Payload:', JSON.stringify(payload, null, 2));

    try {
        const response = await fetch(`${AUTH_SERVICE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        console.log('Response Status:', response.status);
        const data = await response.json();
        console.log('Response Body:', data);

        if (response.status === 201) {
            console.log('✅ Registration Successful (Status 201)');
        } else {
            console.error('❌ Registration Failed: Unexpected Status');
            process.exit(1);
        }

        if (data.userId) {
            console.log('✅ User ID received:', data.userId);
        } else {
            console.error('❌ User ID missing in response');
            process.exit(1);
        }

        if (data.requireOtp === true) {
            console.log('✅ Require OTP flag is true');
        } else {
            console.error('❌ Require OTP flag missing or false');
            process.exit(1);
        }

        console.log('--- Verification Complete: PASSED ---');

    } catch (error) {
        console.error('❌ Request Failed:', error.message);
        process.exit(1);
    }
}

// Run the test
testRegistration();
