require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkAndCreateUser() {
    try {
        // Check if user exists
        let user = await prisma.user.findUnique({
            where: { email: 'tony.stark@budolshap.com' }
        });

        if (user) {
            console.log('✅ User exists:');
            console.log('   Email:', user.email);
            console.log('   Name:', user.name);
            console.log('   Account Type:', user.accountType);
            console.log('   Has Password:', !!user.password);

            // Update password to ensure it's correct
            const hashedPassword = await bcrypt.hash('budolshap', 10);
            await prisma.user.update({
                where: { email: 'tony.stark@budolshap.com' },
                data: { password: hashedPassword }
            });
            console.log('✅ Password updated to: budolshap');
        } else {
            console.log('❌ User not found. Creating user...');

            const hashedPassword = await bcrypt.hash('budolshap', 10);
            user = await prisma.user.create({
                data: {
                    id: 'tony-stark-' + Date.now(),
                    email: 'tony.stark@budolshap.com',
                    name: 'Tony Stark',
                    password: hashedPassword,
                    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TonyStark',
                    accountType: 'BUYER',
                    emailVerified: true
                }
            });
            console.log('✅ User created successfully!');
            console.log('   Email: tony.stark@budolshap.com');
            console.log('   Password: budolshap');
        }

        // Check if user has an address
        const addresses = await prisma.address.findMany({
            where: { userId: user.id }
        });

        console.log('\n📍 Addresses:', addresses.length);
        if (addresses.length === 0) {
            console.log('⚠️  No addresses found. Creating default address...');

            await prisma.address.create({
                data: {
                    userId: user.id,
                    name: 'Tony Stark',
                    email: 'tony.stark@budolshap.com',
                    street: 'Arroceros St',
                    barangay: 'Ermita',
                    city: 'Manila',
                    state: 'NCR',
                    zip: '1000',
                    country: 'Philippines',
                    phone: '+639171234567',
                    latitude: 14.5995,
                    longitude: 120.9842
                }
            });
            console.log('✅ Default address created');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkAndCreateUser();
