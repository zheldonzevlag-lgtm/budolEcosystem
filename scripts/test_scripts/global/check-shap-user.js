const { PrismaClient } = require('@prisma/client');
// No need to specify datasource if using .env
const prisma = new PrismaClient();

async function checkUser() {
    try {
        const email = 'galvezjon59@gmail.com';
        console.log('Prisma keys:', Object.keys(prisma).filter(k => !k.startsWith('$')));
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (user) {
            console.log('User in budolShap:', JSON.stringify(user, null, 2));
        } else {
            console.log('User not found in budolShap');
        }
    } catch (error) {
        console.error('Prisma Error:', error);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

checkUser();
