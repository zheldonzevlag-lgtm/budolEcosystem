const { prisma } = require('@budolpay/database');

async function main() {
    try {
        const apps = await prisma.ecosystemApp.findMany();
        console.log('Registered Apps:');
        apps.forEach(app => {
            console.log(`- Name: ${app.name}`);
            console.log(`  API Key: ${app.apiKey}`);
            console.log(`  Redirect URI: ${app.redirectUri}`);
            console.log('---');
        });
    } catch (e) {
        console.error('Database error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
