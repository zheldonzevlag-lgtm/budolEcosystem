const { prisma } = require('@budolpay/database');

async function listUsers() {
    try {
        const users = await prisma.user.findMany({
            take: 5,
            include: { wallet: true }
        });
        console.log(JSON.stringify(users, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

listUsers();
