const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Users in budolpay Database ---');
    const users = await prisma.user.findMany({
        select: { id: true, email: true, firstName: true, lastName: true }
    });
    console.table(users);
    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
