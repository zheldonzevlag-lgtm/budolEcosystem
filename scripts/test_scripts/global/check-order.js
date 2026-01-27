const { PrismaClient } = require('./budolpay-0.1.0/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function checkSpecificOrder() {
    const orderId = 'cmjxbftbq0001gpy0kpn6vobk';
    console.log(`Checking for transaction with orderId: ${orderId}`);
    
    try {
        const transactions = await prisma.transaction.findMany({
            where: {
                metadata: {
                    contains: orderId
                }
            }
        });
        
        console.log('Transactions found:', JSON.stringify(transactions, null, 2));
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSpecificOrder();
