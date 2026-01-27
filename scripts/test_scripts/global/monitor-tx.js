const { PrismaClient } = require('./budolpay-0.1.0/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function monitorTransaction() {
    const transactionId = '1963954e-7c3e-431c-9d72-02914d4a632c';
    console.log(`Monitoring transaction: ${transactionId}`);
    
    try {
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId }
        });
        
        console.log('Status:', transaction.status);
        console.log('Sender ID:', transaction.senderId);
        console.log('Completed At:', transaction.completedAt);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

monitorTransaction();
