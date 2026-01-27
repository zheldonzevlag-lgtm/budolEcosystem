const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config({ path: '../../.env.connection.prod' });

const BASE_URL = 'http://localhost:8001';
const TEST_PHONE = '+63' + Math.floor(9000000000 + Math.random() * 999999999).toString();
const TEST_PIN = '888888';
const TEST_DEVICE_ID = 'profile-test-device-' + Date.now();

async function runProfileTests() {
    console.log('🚀 Starting Profile Update Tests (Compliance Aligned)...\n');

    try {
        // 0. Clean up
        console.log('🧹 Cleaning up test user...');
        const existingByPhone = await prisma.user.findUnique({ where: { phoneNumber: TEST_PHONE } });
        if (existingByPhone) {
            await prisma.user.delete({ where: { id: existingByPhone.id } });
        }
        const testEmail = `${TEST_PHONE}@budolpay.local`;
        const existingByEmail = await prisma.user.findUnique({ where: { email: testEmail } });
        if (existingByEmail) {
            await prisma.user.delete({ where: { id: existingByEmail.id } });
        }

        // 1. Registration
        console.log('📝 Registering test user...');
        const regRes = await axios.post(`${BASE_URL}/register`, {
            phoneNumber: TEST_PHONE,
            firstName: 'Juan',
            lastName: 'Dela Cruz',
            pin: TEST_PIN,
            deviceId: TEST_DEVICE_ID
        });
        const userId = regRes.data.userId;
        console.log(`   User Registered with ID: ${userId}`);
        console.log(`   Using DB: ${process.env.DATABASE_URL.substring(0, 50)}...`);

        // 2. OTP Verification
        console.log('🔑 Verifying OTP...');
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            console.log('❌ User not found in DB! Check if the API and Test Script use the same DB.');
            throw new Error('User null after registration');
        }
        await axios.post(`${BASE_URL}/verify-otp`, {
            userId,
            otp: user.otpCode,
            deviceId: TEST_DEVICE_ID,
            type: 'SMS'
        });

        // 3. Login to get token
        console.log('🔢 Logging in...');
        const loginRes = await axios.post(`${BASE_URL}/login/mobile/verify-pin`, {
            userId,
            pin: TEST_PIN,
            deviceId: TEST_DEVICE_ID
        });
        const token = loginRes.data.token;
        const authConfig = { headers: { Authorization: `Bearer ${token}` } };

        // 4. Update Profile (Normal User)
        console.log('\n✅ Testing Normal Profile Update...');
        const update1 = await axios.patch(`${BASE_URL}/profile`, {
            firstName: 'Johnny',
            lastName: 'Cruz',
            email: 'johnny@example.com'
        }, authConfig);
        console.log('   Result:', update1.data.message);
        console.log('   Updated Name:', `${update1.data.user.firstName} ${update1.data.user.lastName}`);

        // 5. Upgrade to FULLY_VERIFIED
        console.log('\n🛡️ Upgrading user to FULLY_VERIFIED in DB...');
        await prisma.user.update({
            where: { id: userId },
            data: { kycTier: 'FULLY_VERIFIED' }
        });

        // 6. Attempt restricted name change
        console.log('\n🚫 Testing Restricted Name Change (Compliance Check)...');
        try {
            await axios.patch(`${BASE_URL}/profile`, {
                firstName: 'IllegalNameChange'
            }, authConfig);
            console.log('❌ Error: Name change should have been blocked!');
        } catch (error) {
            console.log('✅ Correctly Blocked:', error.response.data.error);
        }

        // 7. Attempt allowed email change
        console.log('\n📧 Testing Allowed Email Change for Verified User...');
        const update2 = await axios.patch(`${BASE_URL}/profile`, {
            email: 'verified-johnny@example.com'
        }, authConfig);
        console.log('✅ Success:', update2.data.message);
        console.log('   New Email:', update2.data.user.email);

        console.log('\n✨ All Profile Update Tests Passed!');

    } catch (error) {
        console.error('\n❌ Test Failed!');
        if (error.response) {
            console.error('   Error Data:', error.response.data);
        } else {
            console.error('   Message:', error.message);
        }
    } finally {
        await prisma.$disconnect();
    }
}

runProfileTests();
