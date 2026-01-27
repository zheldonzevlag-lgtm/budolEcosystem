const { PrismaClient } = require('./budolpay-0.1.0/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function checkRecentTransactions() {
    const userId = 'a48aeedf-b60d-46c3-b350-6c8a4bd363ec';
    console.log(`Checking transactions for user: ${userId}`);
    
    try {
        const transactions = await prisma.transaction.findMany({
            where: {
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 5
        });
        
        console.log('Recent Transactions:', JSON.stringify(transactions, null, 2));
        
        const wallet = await prisma.wallet.findUnique({
            where: { userId }
        });
        console.log('Current Balance:', wallet ? wallet.balance : 'N/A');
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkRecentTransactions();
