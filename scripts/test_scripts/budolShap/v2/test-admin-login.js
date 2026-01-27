require('dotenv').config({ path: '.env.production' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLogin(email, password) {
    console.log(`🔐 Testing login for: ${email}`);

    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            console.log('❌ User not found!');
            return;
        }

        console.log(`✅ User found: ${user.name} (${user.accountType})`);

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            console.log('✅ Password matches! Login successful.');
            console.log('User ID:', user.id);
            console.log('Roles:', {
                isAdmin: user.isAdmin,
                accountType: user.accountType
            });
        } else {
            console.log('❌ Password does NOT match.');
        }

    } catch (error) {
        console.error('Error during login test:', error);
    } finally {
        await prisma.$disconnect();
    }
}

const email = process.argv[2] || 'admin@budolshap.com';
const password = process.argv[3] || 'tr@1t0r';

testLogin(email, password);
