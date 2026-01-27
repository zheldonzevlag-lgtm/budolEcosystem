const axios = require('axios');
const { prisma } = require('@budolpay/database');

const AUTH_SERVICE_URL = 'http://localhost:8001';
const TEST_USER_ID = 'test-user-v407'; // We'll create or find a user
const TEST_PIN = '123456';
const TEST_DEVICE_ID = 'test-device-407';

async function runTest() {
    console.log('🚀 Starting Forensic Audit Verification for Mobile Auth (v407)...');

    try {
        // 1. Ensure test user exists
        let user = await prisma.user.findUnique({ where: { id: TEST_USER_ID } });
        if (!user) {
            console.log('👤 Creating test user...');
            const bcrypt = require('bcryptjs');
            const pinHash = await bcrypt.hash(TEST_PIN, 10);
            user = await prisma.user.create({
                data: {
                    id: TEST_USER_ID,
                    phoneNumber: '+639000000407',
                    email: 'test407@budolpay.com',
                    firstName: 'Audit',
                    lastName: 'Test',
                    pinHash: pinHash,
                    passwordHash: 'SOCIAL_OR_MOBILE_ONLY',
                    biometricKeyId: 'test-bio-key-407',
                    trustedDevices: JSON.stringify([{ deviceId: TEST_DEVICE_ID, isVerified: true, addedAt: new Date() }])
                }
            });
        }

        // 2. Simulate Mobile PIN Login
        console.log('\n🔢 Simulating Mobile PIN Login...');
        try {
            await axios.post(`${AUTH_SERVICE_URL}/login/mobile/verify-pin`, {
                userId: TEST_USER_ID,
                pin: TEST_PIN,
                deviceId: TEST_DEVICE_ID
            });
            console.log('✅ PIN Login Request sent.');
        } catch (err) {
            console.warn('⚠️ PIN Login Request failed (is service running?), but we will check DB for logs anyway if possible.');
        }

        // 3. Simulate Mobile Biometric Login
        console.log('\n🧬 Simulating Mobile Biometric Login...');
        try {
            await axios.post(`${AUTH_SERVICE_URL}/biometric/login-verify`, {
                userId: TEST_USER_ID,
                deviceId: TEST_DEVICE_ID,
                signature: 'test-signature-v407'
            });
            console.log('✅ Biometric Login Request sent.');
        } catch (err) {
            console.warn('⚠️ Biometric Login Request failed.');
        }

        // 4. Verify Audit Logs in Database
        console.log('\n🔍 Verifying Audit Logs in Database...');
        // Wait 2 seconds for async operations
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const allLogs = await prisma.auditLog.findMany({
            where: { userId: TEST_USER_ID },
            orderBy: { createdAt: 'desc' }
        });
        console.log(`DEBUG: Found ${allLogs.length} total logs for user ${TEST_USER_ID}`);
        allLogs.forEach(l => console.log(` - ${l.action} (${l.createdAt})`));

        const logs = await prisma.auditLog.findMany({
            where: {
                userId: TEST_USER_ID,
                action: { in: ['MOBILE_LOGIN_PIN', 'MOBILE_LOGIN_BIOMETRIC'] }
            },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`📊 Found ${logs.length} relevant audit logs.`);

        const pinLog = logs.find(l => l.action === 'MOBILE_LOGIN_PIN');
        const bioLog = logs.find(l => l.action === 'MOBILE_LOGIN_BIOMETRIC');

        if (pinLog) {
            console.log('✅ PIN Login Audit found:');
            console.log(`   - Action: ${pinLog.action}`);
            console.log(`   - Metadata: ${JSON.stringify(pinLog.metadata)}`);
        } else {
            console.error('❌ PIN Login Audit NOT found!');
        }

        if (bioLog) {
            console.log('✅ Biometric Login Audit found:');
            console.log(`   - Action: ${bioLog.action}`);
            console.log(`   - Metadata: ${JSON.stringify(bioLog.metadata)}`);
        } else {
            console.error('❌ Biometric Login Audit NOT found!');
        }

        if (pinLog && bioLog) {
            console.log('\n✨ Forensic Audit Verification SUCCESSFUL for v407!');
        } else {
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ Test Execution Failed:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

runTest();
