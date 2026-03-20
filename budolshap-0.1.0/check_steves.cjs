const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSteves() {
    try {
        console.log('Checking for all Steve Rogers...');
        const steves = await prisma.user.findMany({
            where: { email: 'steve.rogers@budolshap.com' }
        });
        
        console.log(`Found ${steves.length} Steve(s):`);
        steves.forEach(steve => {
            console.log('--------------------------------------------------');
            console.log('ID:', steve.id);
            console.log('Email:', steve.email);
            console.log('deletedAt:', steve.deletedAt);
        });
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkSteves();
