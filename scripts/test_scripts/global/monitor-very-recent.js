const { PrismaClient } = require('./budolpay-0.1.0/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function checkVeryRecentTransactions() {
    console.log('Checking for transactions created in the last 2 minutes...');
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    
    try {
        const transactions = await prisma.transaction.findMany({
            where: {
                createdAt: {
                    gte: twoMinutesAgo
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        
        console.log(`Found ${transactions.length} very recent transactions.`);
        if (transactions.length > 0) {
            console.log('Recent Transactions:', JSON.stringify(transactions, null, 2));
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkVeryRecentTransactions();
