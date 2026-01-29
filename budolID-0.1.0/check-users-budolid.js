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
        console.log('Connecting to budolID database...');
        const users = await prisma.user.findMany();
        console.log('Found users:', users.length);
        users.forEach(u => {
            console.log(`User: ${u.firstName} ${u.lastName} (${u.email})`);
        });
    } catch (e) {
        console.error('Error querying database:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
