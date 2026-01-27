const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserBalance() {
    const userId = '9e628dfa-d597-458a-ad6e-b75bc3ee41a3';
    
    try {
        console.log(`Checking data for user: ${userId}`);
        
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        console.log('User:', user ? `${user.firstName} ${user.lastName} (${user.phoneNumber})` : 'Not found');

        const wallet = await prisma.wallet.findUnique({
            where: { userId }
        });
        console.log('Wallet:', wallet);

        const transactions = await prisma.transaction.findMany({
            where: {
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });
        
        console.log('Recent Transactions:', transactions.length);
        transactions.forEach(t => {
            console.log(`- ID: ${t.id}, Amount: ${t.amount}, Type: ${t.type}, Status: ${t.status}, Date: ${t.createdAt}`);
        });

    } catch (error) {
        console.error('Error checking balance:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUserBalance();
