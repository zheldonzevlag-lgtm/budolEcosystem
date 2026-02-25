const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
    const userId = '8b23b71b-c27e-4964-a15a-ead0b563ea8d';
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        console.log('User found:', JSON.stringify(user, null, 2));
    } catch (error) {
        console.error('Error checking user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
