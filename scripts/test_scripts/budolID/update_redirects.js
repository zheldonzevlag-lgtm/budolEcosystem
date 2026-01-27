const { prisma } = require('@budolpay/database');

async function main() {
    try {
        const LOCAL_IP = process.env.LOCAL_IP || 'localhost';
        console.log(`Updating Redirect URIs for Ecosystem Apps using LOCAL_IP: ${LOCAL_IP}...`);
        
        const updates = [
            {
                name: 'budolPay',
                redirectUri: `http://${LOCAL_IP}:3000/api/auth/callback`
            },
            {
                name: 'budolShap',
                redirectUri: `http://${LOCAL_IP}:3001/api/auth/sso/callback`
            },
            {
                name: 'budolExpress',
                redirectUri: `http://${LOCAL_IP}:3002/api/auth/callback`
            }
        ];

        for (const update of updates) {
            await prisma.ecosystemApp.updateMany({
                where: { name: update.name },
                data: { redirectUri: update.redirectUri }
            });
            console.log(`✅ Updated ${update.name} to ${update.redirectUri}`);
        }

        console.log('\nFinal App Configurations:');
        const apps = await prisma.ecosystemApp.findMany();
        apps.forEach(app => {
            console.log(`- ${app.name}: ${app.redirectUri}`);
        });

    } catch (e) {
        console.error('❌ Update failed:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
