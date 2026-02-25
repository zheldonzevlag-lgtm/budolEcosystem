import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        const settings = await prisma.systemSettings.findUnique({
            where: { id: 'default' }
        });
        console.log('---SYSTEM_SETTINGS_START---');
        console.log(JSON.stringify(settings, null, 2));
        console.log('---SYSTEM_SETTINGS_END---');
    } catch (error) {
        console.error('Error fetching settings:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
