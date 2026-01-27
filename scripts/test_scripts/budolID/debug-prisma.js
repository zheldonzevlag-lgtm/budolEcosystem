const { prisma } = require('@budolpay/database');

async function debug() {
    try {
        console.log('Prisma models:', Object.keys(prisma).filter(key => !key.startsWith('_') && !key.startsWith('$')));
        
        const count = await prisma.ecosystemApp.count();
        console.log('EcosystemApp count:', count);
    } catch (e) {
        console.error('Debug error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

debug();
