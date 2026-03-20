const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugDelete() {
    const userId = 'e8a42664-8bd2-4d45-b5e9-a04c30cb4686';
    console.log(`Checking user ${userId} before update...`);
    
    let user = await prisma.user.findUnique({ where: { id: userId } });
    console.log('Before:', user?.deletedAt);

    console.log('Updating deletedAt...');
    // Use raw query to ensure we are hitting the DB directly
    const count = await prisma.$executeRaw`UPDATE "User" SET "deletedAt" = NOW() WHERE "id" = ${userId}`;
    console.log('Update count:', count);

    user = await prisma.user.findUnique({ where: { id: userId } });
    console.log('After:', user?.deletedAt);
}

debugDelete().catch(console.error).finally(() => prisma.$disconnect());
