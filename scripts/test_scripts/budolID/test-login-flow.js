const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { PrismaClient } = require('../../../budolID-0.1.0/generated/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../budolID-0.1.0/.env') });

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

async function runTest() {
    console.log('🚀 Starting budolID Login & Logging Test');
    
    try {
        // 1. Get a valid app and user
        const app = await prisma.ecosystemApp.findFirst();
        const user = await prisma.user.findFirst();

        if (!app || !user) {
            console.error('❌ Missing test data. Please run seeds first.');
            return;
        }

        console.log(`📝 Testing with App: ${app.name} (${app.apiKey})`);
        console.log(`👤 Testing with User: ${user.email}`);

        // 2. Perform Login Request
        const loginUrl = 'http://127.0.0.1:8000/auth/sso/login';
        const payload = {
            email: 'tony.stark@budolshap.com',
            password: 'budolshap',
            apiKey: app.apiKey
        };

        console.log(`🔗 POST ${loginUrl}`);
        const response = await fetch(loginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ Login Successful!');
            console.log('🎫 Token:', result.token.substring(0, 20) + '...');
            console.log('🔗 Redirect:', result.redirectUri);

            // 3. Verify Session in DB
            const session = await prisma.session.findFirst({
                where: { token: result.token }
            });

            if (session) {
                console.log('✅ Session recorded in Database');
            } else {
                console.log('❌ Session NOT found in Database');
            }

            // 4. Test Token Verification
            const verifyUrl = 'http://127.0.0.1:8000/auth/verify';
            console.log(`🔗 GET ${verifyUrl}`);
            const verifyRes = await fetch(verifyUrl, {
                headers: { 'Authorization': `Bearer ${result.token}` }
            });

            const verifyResult = await verifyRes.json();
            if (verifyRes.ok && verifyResult.valid) {
                console.log('✅ Token Verification Successful');
                console.log(`👋 Welcome, ${verifyResult.user.firstName}!`);
            } else {
                console.log('❌ Token Verification Failed:', verifyResult.error);
            }

        } else {
            console.error('❌ Login Failed:', result.error);
        }

    } catch (error) {
        console.error('❌ Test Execution Error:', error.message);
    } finally {
        await prisma.$disconnect();
        console.log('🏁 Test Finished');
    }
}

runTest();
