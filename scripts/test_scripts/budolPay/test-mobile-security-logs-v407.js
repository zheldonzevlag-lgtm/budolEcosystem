const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

// Force use budolpay database for this test
process.env.DATABASE_URL = "postgresql://postgres:r00t@localhost:5432/budolpay?schema=public";

const { prisma } = require('../../../budolpay-0.1.0/packages/database/index.js');
const axios = require('axios');

async function testMobileSecurityLogs() {
    console.log('🚀 Starting Mobile Security Audit Trail Verification (v407)...');
    
    // Test user details (Peter Parker case)
    const PETER_PHONE = '09123456788'; // Using a variation if 09123456789 is already used
    const TEST_PIN = '123456';
    const DEVICE_ID = 'TEST_DEVICE_V407';
    const PIN_HASH = await bcrypt.hash(TEST_PIN, 10);

    try {
        // 1. Find or Create Peter Parker
        let user = await prisma.user.findFirst({ 
            where: { 
                OR: [
                    { phoneNumber: PETER_PHONE },
                    { firstName: 'Peter', lastName: 'Parker' }
                ]
            } 
        });

        if (!user) {
            console.log('Creating Peter Parker test user...');
            user = await prisma.user.create({
                data: {
                    email: 'peter.parker@dailybugle.com',
                    phoneNumber: PETER_PHONE,
                    firstName: 'Peter',
                    lastName: 'Parker',
                    passwordHash: 'dummy',
                    pinHash: PIN_HASH,
                    role: 'USER',
                    trustedDevices: JSON.stringify([{ deviceId: DEVICE_ID, isVerified: true, addedAt: new Date() }])
                }
            });
        } else {
            console.log(`✅ Peter Parker found: ${user.id}`);
            // Ensure pin is set and device is trusted for testing
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    pinHash: PIN_HASH,
                    trustedDevices: JSON.stringify([{ deviceId: DEVICE_ID, isVerified: true, addedAt: new Date() }])
                }
            });
        }

        const userId = user.id;

        // 2. Test Phase 1: Identification (Success)
        console.log('\n🔍 Testing Phase 1: Identification (Success)...');
        const idRes = await axios.post('http://localhost:8001/login/mobile/identify', {
            phoneNumber: user.phoneNumber,
            deviceId: DEVICE_ID
        });
        console.log('Response Status:', idRes.data.status);

        // 3. Test Phase 1: Identification (Failure - Wrong Phone)
        console.log('\n❌ Testing Phase 1: Identification (Failure - Unknown User)...');
        try {
            await axios.post('http://localhost:8001/login/mobile/identify', {
                phoneNumber: '09000000000',
                deviceId: DEVICE_ID
            });
        } catch (e) {
            console.log('Expected failure caught:', e.response?.data?.error);
        }

        // 4. Test Phase 2: PIN Login (Success)
        console.log('\n🔐 Testing Phase 2: PIN Login (Success)...');
        const pinRes = await axios.post('http://localhost:8001/login/mobile/verify-pin', {
            userId: userId,
            pin: TEST_PIN,
            deviceId: DEVICE_ID
        });
        console.log('PIN Login Status: SUCCESS');

        // 5. Test Phase 2: PIN Login (Failure - Wrong PIN)
        console.log('\n❌ Testing Phase 2: PIN Login (Failure - Incorrect PIN)...');
        try {
            await axios.post('http://localhost:8001/login/mobile/verify-pin', {
                userId: userId,
                pin: '999999',
                deviceId: DEVICE_ID
            });
        } catch (e) {
            console.log('Expected PIN failure caught:', e.response?.data?.error);
        }

        // 5.5 Test Phase 3: Logout (Success)
        console.log('\n🚪 Testing Phase 3: Logout (Success)...');
        await axios.post('http://localhost:8001/logout', {
            userId: userId,
            deviceId: DEVICE_ID
        });
        console.log('Logout Status: SUCCESS');

        // 6. Verify Audit Logs in Database
        console.log('\n🔍 Verifying Forensic Audit Logs in Database...');
        // Wait a bit for async log creation
        await new Promise(resolve => setTimeout(resolve, 3000));

        const expectedActions = [
            'SECURITY_MOBILE_IDENTIFY_SUCCESS',
            'SECURITY_MOBILE_IDENTIFY_FAILED',
            'SECURITY_MOBILE_LOGIN_PIN',
            'SECURITY_MOBILE_LOGIN_PIN_FAILED',
            'SECURITY_LOGOUT'
        ];

        const logs = await prisma.auditLog.findMany({
            where: {
                OR: [
                    { userId: userId },
                    { action: 'SECURITY_MOBILE_IDENTIFY_FAILED' } // This one has null userId
                ],
                action: { in: expectedActions }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        console.log(`\nFound ${logs.length} relevant logs:`);
        logs.forEach(log => {
            console.log(`- [${log.createdAt.toISOString()}] ${log.action}: ${JSON.stringify(log.metadata || log.details)}`);
        });

        const actionsFound = new Set(logs.map(l => l.action));
        const missingActions = expectedActions.filter(a => !actionsFound.has(a));

        if (missingActions.length === 0) {
            console.log('\n✅ ALL SECURITY LOGS VERIFIED IN DATABASE!');
        } else {
            console.error('\n❌ MISSING LOGS:', missingActions);
        }

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    } finally {
        await prisma.$disconnect();
    }
}

testMobileSecurityLogs();
