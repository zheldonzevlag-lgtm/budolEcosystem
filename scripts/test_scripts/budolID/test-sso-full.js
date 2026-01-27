require('dotenv').config();
const { prisma } = require('@budolpay/database');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc=';
const BUDOLPAY_CALLBACK = 'http://127.0.0.1:3000/api/auth/callback';
const BUDOLSHAP_CALLBACK = 'http://127.0.0.1:3001/auth/callback';

async function runTest(targetApp = 'budolPay') {
    const callbackBase = targetApp === 'budolPay' ? BUDOLPAY_CALLBACK : BUDOLSHAP_CALLBACK;
    console.log(`\n=== Testing SSO for ${targetApp} ===`);
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    try {
        console.log(`--- Phase 1: Preparing Real budolID Session for ${targetApp} ---`);
        
        // Use a user that we KNOW exists from debug-users.js
        const targetEmail = 'reynaldomgalvez@gmail.com'; 
        
        // 1. Get User and App
        const user = await prisma.user.findUnique({ where: { email: targetEmail } });
        console.log(`User query result for ${targetEmail}:`, user ? `Found (${user.id})` : 'Not Found');
        
        const app = await prisma.ecosystemApp.findFirst({ where: { name: targetApp } });
        console.log('App query result:', app ? `Found (${app.id})` : 'Not Found');

        if (!user || !app) {
            throw new Error(`User or App not found. User: ${!!user}, App: ${!!app}`);
        }

        // 2. Generate Token
        const token = jwt.sign(
            { 
                sub: user.id,
                email: user.email, 
                role: user.role,
                appId: targetApp 
            }, 
            JWT_SECRET, 
            { expiresIn: '1h' }
        );

        // 3. Insert Session into budolID DB
        await prisma.session.create({
            data: {
                userId: user.id,
                appId: app.id,
                token: token,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
            }
        });

        console.log(`✅ Session created in budolID database for ${targetApp}.`);

        const callbackUrl = `${callbackBase}?token=${token}`;
        console.log('Mock Callback URL:', callbackUrl);

        console.log(`--- Phase 2: Callback at ${targetApp} ---`);
        
        const response = await fetch(callbackUrl, {
            redirect: 'manual'
        });

        console.log(`✅ SUCCESS: ${targetApp} callback processed.`);
        const location = response.headers.get('location');
        console.log('Redirect Location:', location);
        
        if (location && location.includes('error=')) {
            console.error(`❌ Error in redirect for ${targetApp}:`, location);
        } else if (location) {
            console.log(`🎉 SSO Flow Successful for ${targetApp}! Redirecting to dashboard.`);
        } else {
            console.log(`No redirect location found for ${targetApp}, but request succeeded.`);
        }

    } catch (error) {
        console.error(`❌ Test Failed for ${targetApp}:`, error.message);
    }
}

async function main() {
    await runTest('budolPay');
    await runTest('budolShap');
    await prisma.$disconnect();
}

main();
