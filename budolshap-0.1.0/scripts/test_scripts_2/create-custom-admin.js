require('dotenv').config({ path: '.env.production' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createCustomAdmin() {
    try {
        console.log('🔧 Creating admin account...\n');

        const email = 'admin@budolshap.com';
        const password = 'tr@1t0r';
        const name = 'Admin User';

        // Check if admin already exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email }
        });

        if (existingAdmin) {
            console.log('⚠️  Admin account already exists!');
            console.log(`📧 Email: ${email}`);
            console.log('\n💡 If you want to reset the password, delete the user first.');
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
        console.log(`   Email Verified: Yes`);
        console.log('\n📝 Login Credentials:');
        console.log(`   📧 Email: ${email}`);
        console.log(`   🔑 Password: ${password}`);
        console.log('\n✅ You can now login to the admin panel!');

    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

createCustomAdmin();
