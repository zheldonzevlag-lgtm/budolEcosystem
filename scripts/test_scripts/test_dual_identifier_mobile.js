const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:8001'; // budolPay-Auth Service port
const TEST_PHONE = '09123456780';
const TEST_EMAIL = 'reynaldomgalvez@gmail.com';
const DEVICE_ID = 'test_device_e2e';

async function runTests() {
    console.log('--- Starting Dual Identifier Mobile Login Tests ---');

    try {
        // Test 1: Identify via Phone
        console.log('\nTest 1: Identify via Phone');
        const phoneResp = await axios.post(`${BASE_URL}/login/mobile/identify`, {
            phoneNumber: TEST_PHONE,
            deviceId: DEVICE_ID
        });
        console.log('Response:', phoneResp.data.status);
        if (phoneResp.data.status === 'OTP_REQUIRED' || phoneResp.data.status === 'AUTH_REQUIRED') {
            console.log('✅ Phone identification successful');
        } else {
            console.log('❌ Phone identification failed:', phoneResp.data);
        }

        // Test 2: Identify via Email
        console.log('\nTest 2: Identify via Email');
        const emailResp = await axios.post(`${BASE_URL}/login/mobile/identify`, {
            phoneNumber: TEST_EMAIL,
            deviceId: DEVICE_ID
        });
        console.log('Response:', emailResp.data.status);
        if (emailResp.data.status === 'OTP_REQUIRED' || emailResp.data.status === 'AUTH_REQUIRED') {
            console.log('✅ Email identification successful');
        } else {
            console.log('❌ Email identification failed:', emailResp.data);
        }

        // Test 3: Identify via Invalid Identifier
        console.log('\nTest 3: Identify via Invalid Identifier');
        try {
            await axios.post(`${BASE_URL}/login/mobile/identify`, {
                phoneNumber: 'nonexistent@example.com',
                deviceId: DEVICE_ID
            });
            console.log('❌ Should have failed but succeeded');
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log('✅ Correctly returned 404 for unknown user');
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }

        // Test 4: Check Phone Uniqueness (Exists)
        console.log('\nTest 4: Check Phone Uniqueness (Exists)');
        const checkPhoneExists = await axios.get(`${BASE_URL}/check-phone?phone=${TEST_PHONE}`);
        console.log('Response:', checkPhoneExists.data);
        if (checkPhoneExists.data.exists === true) {
            console.log('✅ Correctly identified existing phone');
        } else {
            console.log('❌ Failed to identify existing phone');
        }

        // Test 5: Check Email Uniqueness (Exists)
        console.log('\nTest 5: Check Email Uniqueness (Exists)');
        const checkEmailExists = await axios.get(`${BASE_URL}/check-email?email=${TEST_EMAIL}`);
        console.log('Response:', checkEmailExists.data);
        if (checkEmailExists.data.exists === true) {
            console.log('✅ Correctly identified existing email');
        } else {
            console.log('❌ Failed to identify existing email');
        }

        // Test 6: Check Phone Uniqueness (Not Exists)
        console.log('\nTest 6: Check Phone Uniqueness (Not Exists)');
        const checkPhoneNotExists = await axios.get(`${BASE_URL}/check-phone?phone=09999999999`);
        console.log('Response:', checkPhoneNotExists.data);
        if (checkPhoneNotExists.data.exists === false) {
            console.log('✅ Correctly identified non-existing phone');
        } else {
            console.log('❌ Incorrectly identified non-existing phone as existing');
        }

        console.log('\n--- Dual Identifier Mobile Login Tests Completed Successfully ---');
    } catch (error) {
        console.error('Test suite failed:', error.message);
        if (error.response) {
            console.error('Error response:', error.response.data);
        }
    }
}

runTests();
