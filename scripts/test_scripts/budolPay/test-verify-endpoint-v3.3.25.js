
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

// Usage: Ensure auth-service is running on port 8001.
// Run this script from budolpay-0.1.0 directory to access node_modules/env.
// node "..\scripts\test_scripts\budolPay\test-verify-endpoint-v3.3.25.js"

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc=';
const AUTH_URL = 'http://localhost:8001';

async function main() {
    try {
        console.log('--- Testing /verify Endpoint ---');

        // 1. Get a user (Marijoy)
        const email = 'marijoy@omsmpc.com';
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            console.error('User marijoy@omsmpc.com not found in DB. Please ensure DB is seeded/synced.');
            // Create user if not exists for testing
             const newUser = await prisma.user.create({
                data: {
                    email,
                    firstName: 'Marijoy',
                    lastName: 'Buenaventura',
                    phoneNumber: '09123456789',
                    passwordHash: 'hashed_password',
                    kycTier: 'VERIFIED',
                    kycStatus: 'APPROVED'
                }
            });
            console.log('Created test user:', newUser.email);
            return main(); // Retry
        }
        console.log(`Found user: ${user.firstName} ${user.lastName} (${user.id})`);

        // 2. Generate a token
        const token = jwt.sign(
            { userId: user.id, role: user.role, type: 'MOBILE' }, 
            JWT_SECRET, 
            { expiresIn: '1h' }
        );
        console.log('Generated Test Token');

        // 3. Call /verify
        try {
            const response = await axios.get(`${AUTH_URL}/verify`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log('Response Status:', response.status);
            // console.log('Response Body:', JSON.stringify(response.data, null, 2));

            // 4. Validate Data
            const userData = response.data.user;
            let success = true;

            if (userData.firstName === user.firstName && userData.lastName === user.lastName) {
                console.log('✅ SUCCESS: First Name and Last Name are UNMASKED.');
            } else {
                console.log('❌ FAILURE: Names are still masked or incorrect.');
                console.log(`Expected: ${user.firstName}, Got: ${userData.firstName}`);
                success = false;
            }

            if (userData.email === user.email) {
                console.log('✅ SUCCESS: Email is present and correct.');
            } else {
                console.log('❌ FAILURE: Email is missing or incorrect.');
                success = false;
            }

            if (success) {
                console.log('\n✨ VERIFICATION PASSED: The /verify endpoint returns unmasked data correctly.');
            } else {
                console.log('\n💀 VERIFICATION FAILED: Issues detected.');
            }

        } catch (err) {
            console.error('API Call Failed:', err.message);
            if (err.response) {
                console.error('Status:', err.response.status);
                console.error('Data:', err.response.data);
            }
        }

    } catch (error) {
        console.error('Test Error:', error);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

main();
