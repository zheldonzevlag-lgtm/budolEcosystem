
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSettings() {
    try {
        const settings = await prisma.systemSettings.findUnique({
            where: { id: 'default' }
        });
        console.log(JSON.stringify(settings, null, 2));
    } catch (error) {
        console.error('Error checking settings:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSettings();
