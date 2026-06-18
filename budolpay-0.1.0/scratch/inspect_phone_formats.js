const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Inspecting User Phone Formats ---');
    try {
        const users = await prisma.user.findMany({
            select: { phoneNumber: true, email: true },
            take: 5
        });
        console.table(users);
    } catch (err) {
        console.error('Database inspection failed:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
