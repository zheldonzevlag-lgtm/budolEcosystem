const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSteve() {
    try {
        console.log('Checking for Steve Rogers...');
        const steve = await prisma.user.findFirst({
            where: { email: 'steve.rogers@budolshap.com' }
        });
        
        if (steve) {
            console.log('Steve Rogers record found:');
            console.log('ID:', steve.id);
            console.log('Email:', steve.email);
            console.log('deletedAt:', steve.deletedAt);
        } else {
            console.log('Steve Rogers not found in database.');
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkSteve();
