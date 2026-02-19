
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const AUTH_URL = 'http://localhost:8001';

async function main() {
    console.log('--- Testing Auth Flow for marijoy@omsmpc.com ---');

    // 1. Identify
    console.log('\n1. Identifying Mobile...');
    try {
        const idRes = await axios.post(`${AUTH_URL}/login/mobile/identify`, {
            phoneNumber: '09484099405', // Marijoy's number
            deviceId: 'TEST_DEVICE_ID'
        });
        console.log('Identify Status:', idRes.status);
        console.log('Identify User (should be masked):', idRes.data.user);
        
        const userId = idRes.data.userId;
        
        // Get OTP from DB
        const user = await prisma.user.findUnique({ where: { id: userId } });
        console.log('OTP Code:', user.otpCode);

        // 2. Verify OTP
        console.log('\n2. Verifying OTP...');
        const verifyOtpRes = await axios.post(`${AUTH_URL}/verify-otp`, {
            userId: userId,
            otp: user.otpCode,
            type: 'SMS',
            deviceId: 'TEST_DEVICE_ID'
        });
        console.log('Verify OTP Status:', verifyOtpRes.status);
        console.log('Verify OTP Token:', verifyOtpRes.data.token ? 'PRESENT' : 'MISSING');
        console.log('Verify OTP User (should be masked):', verifyOtpRes.data.user);

        const token = verifyOtpRes.data.token;

        // 3. Call /verify
        console.log('\n3. Calling /verify...');
        const verifyRes = await axios.get(`${AUTH_URL}/verify`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Verify Status:', verifyRes.status);
        
        // Check if user data is unmasked
        const vUser = verifyRes.data.user;
        console.log('Verify User ID:', vUser.id);
        console.log('Verify User Email:', vUser.email);
        console.log('Verify User FirstName:', vUser.firstName);
        console.log('Verify User LastName:', vUser.lastName);
        
        if (vUser.firstName.includes('*')) {
            console.log('❌ FAIL: /verify returned MASKED data.');
        } else {
            console.log('✅ PASS: /verify returned UNMASKED data.');
        }

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
