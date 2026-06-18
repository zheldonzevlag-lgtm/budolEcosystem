const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkApp() {
    const app = await prisma.ecosystemApp.findUnique({
        where: { apiKey: 'bs_ac2bca9790f9b70f4e21c8a3c2812917' }
    });
    console.log('App info:', app);
    await prisma.$disconnect();
}

checkApp();
