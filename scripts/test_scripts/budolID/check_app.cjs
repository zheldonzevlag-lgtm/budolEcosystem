const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkApp() {
    const app = await prisma.ecosystemApp.findUnique({
        where: { apiKey: 'bs_key_2025' }
    });
    console.log('App info:', app);
    await prisma.$disconnect();
}

checkApp();
