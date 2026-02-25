require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');

async function simpleCheck() {
    const prisma = new PrismaClient();
    try {
        console.log('Connecting to database...');
        const userCount = await prisma.user.count();
        console.log(`✅ Connection successful!`);
        console.log(`👥 Total Users: ${userCount}`);

        const admin = await prisma.user.findFirst({
            where: { email: 'admin@budolshap.com' }
        });

        if (admin) {
            console.log(`✅ Admin user found: ${admin.email}`);
        } else {
            console.log(`❌ Admin user NOT found.`);
        }
    } catch (e) {
        console.error('❌ Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

simpleCheck();
