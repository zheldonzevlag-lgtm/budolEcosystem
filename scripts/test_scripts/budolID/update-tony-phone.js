const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateTony() {
    try {
        await prisma.user.update({
            where: { email: 'tony.stark@budolshap.com' },
            data: { phoneNumber: '09179999999' }
        });
        console.log('Tony Stark phone updated to 09179999999');
    } catch (e) {
        console.error('Error updating Tony:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

updateTony();
