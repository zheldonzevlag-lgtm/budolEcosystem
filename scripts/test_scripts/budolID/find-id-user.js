const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findUser() {
    try {
        const user = await prisma.user.findUnique({
            where: { id: 'd64df8de-6349-4bc9-8b68-8df3a8538c2a' }
        });
        console.log('BudolID User:', JSON.stringify(user, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
findUser();
