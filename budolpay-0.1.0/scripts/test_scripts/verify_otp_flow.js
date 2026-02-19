const axios = require('axios');

const AUTH_URL = 'http://localhost:8001';
const TEST_PHONE = '09171239999'; // A test number

async function runTest() {
    console.log('Starting OTP Flow Verification...');

    try {
        // 1. Quick Register (to ensure user exists and is fresh)
        console.log(`\n[1] Registering/Checking user ${TEST_PHONE}...`);
        try {
            const regRes = await axios.post(`${AUTH_URL}/register/quick`, {
                phoneNumber: TEST_PHONE,
                firstName: 'TestUser',
                deviceId: 'device-' + Date.now() // Unique device ID
            });
            console.log('Registration successful:', regRes.data);
        } catch (e) {
            if (e.response && e.response.status === 400 && e.response.data.exists) {
                console.log('User already exists, proceeding to login.');
            } else {
                console.error('Registration failed:', e.message);
                // Continue anyway to try login
            }
        }

        // 2. Mobile Login Identify (should trigger OTP if device is new/untrusted)
        console.log(`\n[2] Identifying user (Login)...`);
        const loginRes = await axios.post(`${AUTH_URL}/login/mobile/identify`, {
            phoneNumber: TEST_PHONE,
            deviceId: 'device-' + Date.now() // New device ID to force OTP
        });
        console.log('Login Identify Response:', loginRes.data);

        if (loginRes.data.status === 'OTP_REQUIRED') {
            console.log('SUCCESS: OTP was required as expected.');
        } else if (loginRes.data.status === 'AUTH_REQUIRED') {
            console.log('WARNING: OTP was SKIPPED. Device might be trusted or logic is different.');
        }

        const userId = loginRes.data.userId || loginRes.data.user?.id;

        if (userId) {
            // 3. Resend OTP
            console.log(`\n[3] Resending OTP for userId: ${userId}...`);
            try {
                const resendRes = await axios.post(`${AUTH_URL}/resend-otp`, {
                    userId: userId,
                    type: 'SMS'
                });
                console.log('Resend OTP Response:', resendRes.data);
            } catch (e) {
                if (e.response && e.response.status === 429) {
                    console.log('Resend OTP Rate Limit Hit (Expected if too fast).');
                } else {
                    console.error('Resend OTP Failed:', e.message, e.response?.data);
                }
            }
        } else {
            console.error('Could not get userId for Resend OTP test.');
        }

    } catch (err) {
        console.error('Test Failed:', err.message);
        if (err.response) {
            console.error('Response Status:', err.response.status);
            console.error('Response Data:', err.response.data);
        }
    }
}

runTest();
