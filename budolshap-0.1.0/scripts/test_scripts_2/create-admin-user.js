require('dotenv').config({ path: '.env.production' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
    try {
        const email = process.argv[2] || 'admin2@budolshap.com';
        const password = process.argv[3] || 'password123';
        const name = process.argv[4] || 'Admin Two';

        console.log(`🔧 Creating admin account: ${email}...\n`);

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            console.log('⚠️  Account already exists!');
            console.log(`📧 Email: ${email}`);
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create admin user
        const admin = await prisma.user.create({
            data: {
                id: `admin_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
                name,
                email,
                password: hashedPassword,
                accountType: 'ADMIN',
                emailVerified: true,
                image: '',
                cart: {}
            }
        });

        console.log('✅ Admin account created successfully!\n');
        console.log('📋 Admin Details:');
        console.log(`   ID: ${admin.id}`);
        console.log(`   Name: ${admin.name}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Account Type: ${admin.accountType}`);
        console.log('\n📝 Login Credentials:');
        console.log(`   📧 Email: ${email}`);
        console.log(`   🔑 Password: ${password}`);

    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
