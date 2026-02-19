const axios = require('axios');
const { prisma } = require('@budolpay/database');

const API_URL = process.env.API_URL || 'http://localhost:8001'; // Default to 8001
const TEST_EMAIL = 'test_profile_update@budolpay.com';
const TEST_PASSWORD = 'password123';

async function runTest() {
    console.log('--- Starting Profile Update Test ---');

    try {
        // 1. Setup: Create or Get User
        console.log('1. Setting up test user...');
        let user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
        if (!user) {
            // Register if not exists
            try {
                const regRes = await axios.post(`${API_URL}/register`, {
                    email: TEST_EMAIL,
                    password: TEST_PASSWORD,
                    firstName: 'Test',
                    lastName: 'User',
                    phoneNumber: '09171234567'
                });
                user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
                console.log('   User registered.');
            } catch (e) {
                console.error('   Registration failed:', e.response?.data || e.message);
                return;
            }
        } else {
            console.log('   User already exists.');
        }

        // 2. Login to get Token
        console.log('2. Logging in...');
        const loginRes = await axios.post(`${API_URL}/login`, {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });
        const token = loginRes.data.token;
        console.log('   Login successful. Token obtained.');

        // 3. Test: Update Profile (Valid)
        console.log('3. Testing Valid Profile Update...');
        const newFirstName = 'UpdatedFirst';
        const newLastName = 'UpdatedLast';
        const newEmail = 'updated_email@budolpay.com';

        // Clean up new email if it exists from previous run
        await prisma.user.deleteMany({ where: { email: newEmail } });

        const updateRes = await axios.patch(`${API_URL}/profile`, {
            firstName: newFirstName,
            lastName: newLastName,
            email: newEmail
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('   Update response:', updateRes.status);
        if (updateRes.status === 200) {
            console.log('   Profile update request successful.');
        }

        // 4. Verify Database Persistence
        console.log('4. Verifying Database Persistence...');
        const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
        
        let success = true;
        if (updatedUser.firstName !== newFirstName) {
            console.error(`   ❌ First Name mismatch: Expected ${newFirstName}, got ${updatedUser.firstName}`);
            success = false;
        }
        if (updatedUser.lastName !== newLastName) {
            console.error(`   ❌ Last Name mismatch: Expected ${newLastName}, got ${updatedUser.lastName}`);
            success = false;
        }
        if (updatedUser.email !== newEmail) {
            console.error(`   ❌ Email mismatch: Expected ${newEmail}, got ${updatedUser.email}`);
            success = false;
        }

        if (success) {
            console.log('   ✅ Database persistence verified.');
        } else {
            console.error('   ❌ Database persistence failed.');
        }

        // 5. Test: Validation (Empty Fields)
        console.log('5. Testing Validation (Empty Fields)...');
        try {
            const resEmpty = await axios.patch(`${API_URL}/profile`, {
                firstName: ''
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.error('   ❌ Failed to catch empty First Name. Status:', resEmpty.status);
            console.error('   Response data:', resEmpty.data);
        } catch (e) {
            if (e.response?.status === 400 && e.response?.data?.error === 'First name cannot be empty') {
                console.log('   ✅ Caught empty First Name correctly.');
            } else {
                console.error('   ❌ Unexpected error for empty First Name:', e.response?.data || e.message);
            }
        }

        // 6. Test: Validation (Invalid Email)
        console.log('6. Testing Validation (Invalid Email)...');
        try {
            const resInvalid = await axios.patch(`${API_URL}/profile`, {
                email: 'invalid-email'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.error('   ❌ Failed to catch invalid Email. Status:', resInvalid.status);
            console.error('   Response data:', resInvalid.data);
        } catch (e) {
            if (e.response?.status === 400 && e.response?.data?.error === 'Invalid email format') {
                console.log('   ✅ Caught invalid Email correctly.');
            } else {
                console.error('   ❌ Unexpected error for invalid Email:', e.response?.data || e.message);
            }
        }
        
        // Cleanup
        console.log('Cleaning up...');
        await prisma.user.update({
            where: { id: user.id },
            data: { email: TEST_EMAIL, firstName: 'Test', lastName: 'User' }
        });

    } catch (error) {
        console.error('Test execution error:', error);
    }
}

runTest();
