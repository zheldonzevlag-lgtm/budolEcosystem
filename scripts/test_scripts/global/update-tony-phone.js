const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateTony() {
    await prisma.user.update({
        where: { email: 'tony.stark@budolshap.com' },
        data: { phoneNumber: '09179999999' }
    });
    console.log('Tony Stark phone updated to 09179999999');
    await prisma.$disconnect();
}

updateTony();
