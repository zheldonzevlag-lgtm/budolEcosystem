const { PrismaClient } = require('./generated/client');
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres:r00t@localhost:5432/budolid?schema=public"
        }
    }
});
async function main() {
    const apps = await prisma.ecosystemApp.findMany();
    apps.forEach(app => {
        console.log(`App: ${app.name}, Keys: ${Object.keys(app).join(', ')}`);
        console.log(`Redirect URI: ${app.redirectUri}`);
    });
}
main().catch(console.error).finally(() => prisma.$disconnect());
