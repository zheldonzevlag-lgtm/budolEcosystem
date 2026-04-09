const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- EcosystemApps in BudolID Database ---');
    try {
        const apps = await prisma.ecosystemApp.findMany();
        console.log(JSON.stringify(apps, null, 2));
    } catch (error) {
        console.error('Error fetching apps:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
