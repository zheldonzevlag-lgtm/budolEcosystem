const { PrismaClient } = require('./budolpay-0.1.0/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function checkRecentGlobalTransactions() {
    console.log('Checking for any transactions in the last 10 minutes...');
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    try {
        const transactions = await prisma.transaction.findMany({
            where: {
                createdAt: {
                    gte: tenMinutesAgo
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        
        console.log(`Found ${transactions.length} recent transactions.`);
        if (transactions.length > 0) {
            console.log('Recent Transactions:', JSON.stringify(transactions, null, 2));
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkRecentGlobalTransactions();
