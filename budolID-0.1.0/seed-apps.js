const { PrismaClient } = require('./generated/client');
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres:r00t@localhost:5432/budolid?schema=public"
        }
    }
});

async function main() {
    try {
        console.log('--- Registering BudolShap Ecosystem App ---');

        const app = await prisma.ecosystemApp.upsert({
            where: { apiKey: 'bs_key_2025' },
            update: {
                name: 'BudolShap',
                redirectUri: 'http://192.168.1.2:3001/auth/callback',
                apiSecret: 'bs_secret_2025' // Just a placeholder for local
            },
            create: {
                name: 'BudolShap',
                apiKey: 'bs_key_2025',
                apiSecret: 'bs_secret_2025',
                redirectUri: 'http://192.168.1.2:3001/auth/callback'
            }
        });

        console.log('✅ BudolShap registered with apiKey:', app.apiKey);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
