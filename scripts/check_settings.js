const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const settings = await prisma.systemSettings.findUnique({
            where: { id: 'default' }
        });
        console.log('--- SYSTEM SETTINGS ---');
        console.log(JSON.stringify(settings, null, 2));
        
        const users = await prisma.user.count();
        console.log('--- USER COUNT ---');
        console.log(users);
    } catch (e) {
        console.error('Error fetching settings:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
