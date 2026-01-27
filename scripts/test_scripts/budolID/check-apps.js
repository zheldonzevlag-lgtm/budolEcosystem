const { prisma } = require('@budolpay/database');
async function main() {
    try {
        const apps = await prisma.ecosystemApp.findMany();
        console.log('Apps in DB:', apps.map(a => ({ name: a.name, id: a.id, apiKey: a.apiKey, redirectUri: a.redirectUri })));
    } catch (e) {
        console.error('Error fetching apps:', e);
    }
}
main().finally(() => prisma.$disconnect());
