require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function setupAndTest() {
    try {
        console.log('🔄 Connecting to DB...');
        await prisma.$connect();
        console.log('✅ Connected.');

        console.log('🕵️Checking for John Wick...');
        const email = 'john.wick@budolshap.com';
        const password = 'budolshap';

        let user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            console.log('👤 Creating John Wick...');
            const hashedPassword = await bcrypt.hash(password, 10);
            user = await prisma.user.create({
                data: {
                    name: 'John Wick',
                    email,
                    password: hashedPassword,
                    accountType: 'buyer',
                    emailVerified: true
                }
            });
            console.log('✅ John Wick created.');
        } else {
            console.log('✅ John Wick exists. Resetting password...');
            const hashedPassword = await bcrypt.hash(password, 10);
            await prisma.user.update({
                where: { email },
                data: { password: hashedPassword }
            });
            console.log('🔐 Password reset.');
        }

        console.log('🧹 Cleaning up old stores...');
        try {
            const existingStore = await prisma.store.findUnique({
                where: { userId: user.id }
            });

            if (existingStore) {
                await prisma.store.delete({ where: { id: existingStore.id } });
                console.log('🗑️ Old store deleted.');
            }
        } catch (e) {
            console.log('⚠️ Store cleanup note:', e.message);
        }

        console.log('\n🚀 Starting API Test on PRODUCTION URL...');

        console.log('🔑 Logging in...');
        const loginUrl = 'https://budolshap-2icgua3hp-jons-projects-9722fe4a.vercel.app/api/auth/login';

        let authToken = null;
        try {
            const loginResponse = await fetch(loginUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            console.log(`Login Status: ${loginResponse.status}`);
            const loginData = await loginResponse.json();

            // Check body for token first (common practice)
            if (loginData.token) {
                authToken = loginData.token;
                console.log('🎫 Token found in response body');
            } else {
                // Check set-cookie header if we can access it
                const cookies = loginResponse.headers.get('set-cookie');
                if (cookies) {
                    console.log('🍪 Set-Cookie header found');
                    const match = cookies.match(/token=([^;]+)/);
                    if (match) {
                        authToken = match[1];
                        console.log('🎫 Token extracted from cookie');
                    }
                }
            }
        } catch (err) {
            console.error('❌ Login fetch failed:', err);
            return;
        }

        if (!authToken) {
            console.error('❌ Could not get auth token. Cannot proceed.');
            return;
        }

        console.log('✅ Logged in successfully.');

        console.log('🏪 Creating Store...');
        const storeData = {
            userId: user.id,
            name: "Continental Hotel",
            username: `continental_${Date.now()}`, // Unique username
            description: "High class accessories.",
            email: "continental@budolshap.com",
            contact: "09171234567",
            address: "123 Professional St",
            logo: ""
        };

        const createResponse = await fetch('https://budolshap-2icgua3hp-jons-projects-9722fe4a.vercel.app/api/stores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(storeData)
        });

        console.log(`📡 Create Store Status: ${createResponse.status}`);
        const result = await createResponse.text();
        console.log('📦 Result:', result.substring(0, 200)); // Log first 200 chars

        if (createResponse.ok) {
            console.log('\n🎉 SUCCESS: Store created!');
        } else {
            console.log('\n❌ FAILURE: API returned error.');
        }

    } catch (error) {
        console.error('❌ ULTRA FATAL ERROR:', error);
    } finally {
        await prisma.$disconnect();
    }
}

setupAndTest();
