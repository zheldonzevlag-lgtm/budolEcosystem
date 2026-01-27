const { PrismaClient } = require('./budolpay-0.1.0/packages/database/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function findUsers() {
    try {
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { firstName: { contains: 'jon', mode: 'insensitive' } },
                    { firstName: { contains: 'tony', mode: 'insensitive' } },
                    { firstName: { contains: 'peter', mode: 'insensitive' } },
                    { email: { contains: 'jon', mode: 'insensitive' } },
                    { email: { contains: 'tony', mode: 'insensitive' } },
                    { email: { contains: 'peter', mode: 'insensitive' } }
                ]
            },
            include: {
                wallet: true
            }
        });

        console.log('Found users:', JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Error finding users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

findUsers();
