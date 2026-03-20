const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSteve() {
    try {
        const steve = await prisma.user.findFirst({
            where: { email: 'steve.rogers@budolshap.com' }
        });
        console.log('Steve Rogers record:', JSON.stringify(steve, null, 2));
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkSteve();
