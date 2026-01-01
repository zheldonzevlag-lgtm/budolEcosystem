const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkApps() {
    try {
        const apps = await prisma.ecosystemApp.findMany();
        console.log('--- Ecosystem Apps in budolID ---');
        apps.forEach(app => {
            console.log(`App: ${app.name}`);
            console.log(`  API Key: ${app.apiKey}`);
            console.log(`  Redirect URI: ${app.redirectUri}`);
            console.log('---------------------------');
        });
    } catch (error) {
        console.error('Error checking apps:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkApps();
