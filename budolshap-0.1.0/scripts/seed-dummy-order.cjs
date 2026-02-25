const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const userId = '8b23b71b-c27e-4964-a15a-ead0b563ea8d'; // Reynaldo Galvez
    
    try {
        const order = await prisma.order.create({
            data: {
                userId: userId,
                totalAmount: 1500.00,
                status: 'PENDING',
                paymentStatus: 'UNPAID',
                paymentMethod: 'BUDOLPAY',
                shippingAddress: '123 Test St, Test City',
                items: {
                    create: [
                        {
                            productId: 'test-product-id', // Assuming some product exists or it's a string ID
                            quantity: 1,
                            price: 1500.00,
                            name: 'Test Product'
                        }
                    ]
                }
            }
        });
        console.log('Dummy order created:', order.id);
    } catch (error) {
        console.error('Error creating dummy order:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
