const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- Database Audit ---');
        
        const accounts = await prisma.chartOfAccount.findMany({
            include: { ledgerEntries: true }
        });
        
        console.log(`Found ${accounts.length} accounts.`);
        accounts.forEach(acc => {
            const balance = acc.ledgerEntries.reduce((sum, entry) => {
                return sum + (Number(entry.debit) - Number(entry.credit));
            }, 0);
            console.log(`Account: ${acc.name} (${acc.type}) | Balance: ${balance} | Entries: ${acc.ledgerEntries.length}`);
        });

        console.log('Available Prisma Models:', Object.keys(prisma).filter(k => !k.startsWith('$')));
        
        const txCount = await (prisma.transaction || prisma.transactions).count();
        const totalTxAmount = await prisma.transaction.aggregate({
            _sum: { amount: true }
        });

        console.log(`Total Transactions: ${txCount}`);
        console.log(`Total Transaction Amount (Sum): ${totalTxAmount._sum.amount || 0}`);

        const userCount = await prisma.user.count();
        console.log(`Total Users: ${userCount}`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
