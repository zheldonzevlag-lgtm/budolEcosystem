const { prisma } = require('@budolpay/database');

async function main() {
    console.log('Updating Ecosystem App redirect URIs to 127.0.0.1...');
    
    // budolPay
    await prisma.ecosystemApp.updateMany({
        where: { name: 'budolPay' },
        data: { redirectUri: 'http://127.0.0.1:3000/api/auth/callback' }
    });

    // budolShap - Database pointed to /api/auth/sso/callback, 
    // but we also have /auth/callback. Let's use /auth/callback as it's newer/cleaner 
    // based on our previous tests. Actually, let's stick to what the DB had but fix the IP.
    // Wait, /auth/callback worked in our test. Let's use that.
    await prisma.ecosystemApp.updateMany({
        where: { name: 'budolShap' },
        data: { redirectUri: 'http://127.0.0.1:3001/auth/callback' }
    });

    // budolExpress
    await prisma.ecosystemApp.updateMany({
        where: { name: 'budolExpress' },
        data: { redirectUri: 'http://127.0.0.1:3002/api/auth/callback' }
    });

    console.log('✅ Update complete.');
    
    const apps = await prisma.ecosystemApp.findMany();
    console.log('New Ecosystem Apps state:');
    apps.forEach(app => {
        console.log(`- ${app.name}: ${app.redirectUri}`);
    });
}

main().finally(() => prisma.$disconnect());
