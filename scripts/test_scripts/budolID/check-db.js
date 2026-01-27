const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const apps = await prisma.ecosystemApp.findMany();
    apps.forEach(app => {
        console.log(`App: ${app.name}, Keys: ${Object.keys(app).join(', ')}`);
        console.log(`Redirect URI: ${app.redirectUri}`);
    });
}
main().catch(console.error).finally(() => prisma.$disconnect());
