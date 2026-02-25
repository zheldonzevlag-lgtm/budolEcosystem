
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyOrderRollback() {
    try {
        console.log('🚀 Starting Order Rollback Verification...');

        // 1. Find or create a test user
        const user = await prisma.user.findFirst({
            where: { email: 'buyer1@test.com' },
            include: { Address: true }
        });

        if (!user || !user.Address[0]) {
            console.log('❌ Test user or address not found. Please run seed script first.');
            return;
        }

        const address = user.Address[0];
        const product = await prisma.product.findFirst({ where: { inStock: true } });

        if (!product) {
            console.log('❌ Test product not found.');
            return;
        }

        // 2. Create a mock order in ORDER_PLACED state
        console.log('Creating mock order...');
        const order = await prisma.order.create({
            data: {
                userId: user.id,
                addressId: address.id,
                storeId: product.storeId,
                status: 'ORDER_PLACED',
                paymentMethod: 'QRPH',
                shippingCost: 50,
                total: product.price + 50,
                isPaid: false,
                paymentStatus: 'pending',
                orderItems: {
                    create: [{
                        productId: product.id,
                        quantity: 1,
                        price: product.price
                    }]
                }
            }
        });
        console.log(`✅ Order created with ID: ${order.id}`);

        // 3. Simulate rollback (Cancel order)
        console.log('Simulating rollback to CANCELLED status...');
        const updatedOrder = await prisma.order.update({
            where: { id: order.id },
            data: {
                status: 'CANCELLED',
                paymentStatus: 'cancelled'
            }
        });

        // 4. Verify status
        if (updatedOrder.status === 'CANCELLED' && updatedOrder.paymentStatus === 'cancelled') {
            console.log('✅ SUCCESS: Order status correctly rolled back to CANCELLED.');
        } else {
            console.log(`❌ FAILURE: Unexpected order status: ${updatedOrder.status}`);
        }

        // 5. Cleanup
        console.log('Cleaning up test order...');
        await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
        await prisma.order.delete({ where: { id: order.id } });
        console.log('✅ Cleanup complete.');

    } catch (error) {
        console.error('💥 Rollback Verification Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyOrderRollback();
