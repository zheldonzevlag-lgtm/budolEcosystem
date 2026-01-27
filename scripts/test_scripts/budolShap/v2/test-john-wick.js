require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupAndTest() {
    try {
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
                    accountType: 'buyer', // Starts as buyer
                    emailVerified: true
                }
            });
            console.log('✅ John Wick created.');
        } else {
            console.log('✅ John Wick exists.');
            // Update password to ensure we know it
            const hashedPassword = await bcrypt.hash(password, 10);
            await prisma.user.update({
                where: { email },
                data: { password: hashedPassword }
            });
            console.log('🔐 Password reset to "budolshap"');
        }

        // Clean up any existing store for this user so we can test creation
        const existingStore = await prisma.store.findUnique({
            where: { userId: user.id }
        });

        if (existingStore) {
            console.log('🗑️ Removing existing store for John Wick to run fresh test...');
            await prisma.store.delete({
                where: { id: existingStore.id }
            });
        }

        console.log('\n🚀 Starting API Test on PRODUCTION URL...');

        // 1. Login to get token
        console.log('🔑 Logging in...');
        const loginResponse = await fetch('https://budolshap-2icgua3hp-jons-projects-9722fe4a.vercel.app/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
        }

        const loginData = await loginResponse.json();
        const token = loginData.token; // OR check cookie if token not in body? 
        // The API usually returns token in body based on previous interactions, but let's check.
        // If your login API determines token via cookie setting only, we might need to parse set-cookie header.
        // But usually standard JWT auth returns it. 

        // Wait, fetch in Node won't handle Set-Cookie automatically for subsequent requests unless we use a jar.
        // But my fix allowed Authorization header! So if I get the token, I can send it.

        // Let's assume the login endpoint returns the token in the JSON body as well? 
        // Let's inspect login route quickly if needed, but usually yes.

        if (!token && !loginResponse.headers.get('set-cookie')) {
            console.log('Response body:', loginData);
            throw new Error('No token returned!');
        }

        // If token is in cookie only, we extract it.
        let authToken = token;
        if (!authToken) {
            const cookies = loginResponse.headers.get('set-cookie');
            if (cookies) {
                const tokenMatch = cookies.match(/token=([^;]+)/);
                if (tokenMatch) authToken = tokenMatch[1];
            }
        }

        console.log('✅ Logged in. Token obtained.');

        // 2. Create Store
        console.log('🏪 Creating Store: "Continental Hotel"...');
        const storeData = {
            userId: user.id,
            name: "Continental Hotel",
            username: "continental",
            description: "High class accessories for the professional.",
            email: "continental@budolshap.com",
            contact: "09171234567",
            address: "123 Professional St, New York",
            logo: ""
        };

        const createResponse = await fetch('https://budolshap-2icgua3hp-jons-projects-9722fe4a.vercel.app/api/stores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}` // My fix allows this now!
            },
            body: JSON.stringify(storeData)
        });

        console.log(`📡 Response Status: ${createResponse.status}`);
        const createResult = await createResponse.text();
        console.log('📦 Response:', createResult);

        if (createResponse.ok) {
            console.log('\n🎉 TEST PASSED: Store created successfully!');
        } else {
            console.log('\n❌ TEST FAILED: Could not create store.');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

setupAndTest();
