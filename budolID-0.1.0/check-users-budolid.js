const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
