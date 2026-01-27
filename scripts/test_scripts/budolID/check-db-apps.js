require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { prisma } = require('@budolpay/database');

async function checkApps() {
    try {
        const apps = await prisma.ecosystemApp.findMany();
        console.log('Current Ecosystem Apps in Database:');
        apps.forEach(app => {
            console.log(`- ${app.name}: ${app.redirectUri} (apiKey: ${app.apiKey})`);
        });
    } catch (error) {
        console.error('Error checking apps:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkApps();
