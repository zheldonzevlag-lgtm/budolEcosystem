const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Latest Transactions in budolpay ---');
    const transactions = await prisma.transaction.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            sender: { select: { email: true } },
            receiver: { select: { email: true } }
        }
    });
    console.log(JSON.stringify(transactions, null, 2));
    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
