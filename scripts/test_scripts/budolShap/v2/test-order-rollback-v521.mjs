
import { prisma } from '../../../../budolshap-0.1.0/lib/prisma.js';
import { cancelOrder } from '../../../../budolshap-0.1.0/lib/services/ordersService.js';

async function testOrderRollback() {
    console.log('🚀 Starting Order Rollback Test...');

    try {
        // 1. Find a test user and address
        const user = await prisma.user.findFirst({
            where: { email: { contains: '@' } },
            include: { Address: true, Cart: { include: { cartItems: true } } }
        });

        if (!user || !user.Address[0]) {
            console.error('❌ Test user or address not found');
            return;
        }

        const address = user.Address[0];
        
        // 2. Find a test product
        const product = await prisma.product.findFirst({
            where: { inStock: true }
        });

        if (!product) {
            console.error('❌ Test product not found');
            return;
        }

        console.log(`📝 Using User: ${user.email}, Product: ${product.name}`);

        // 3. Create a mock order (simulating what createOrder does)
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

        console.log(`✅ Mock order created: ${order.id}`);

        // 4. Verify order status is ORDER_PLACED
        let checkOrder = await prisma.order.findUnique({ where: { id: order.id } });
        console.log(`📊 Initial Status: ${checkOrder.status}, Payment Status: ${checkOrder.paymentStatus}`);

        // 5. Simulate Rollback/Cancellation
        console.log('🔄 Simulating order cancellation...');
        await cancelOrder(order.id, true);

        // 6. Verify order status is CANCELLED
        checkOrder = await prisma.order.findUnique({ where: { id: order.id } });
        console.log(`📊 Final Status: ${checkOrder.status}, Payment Status: ${checkOrder.paymentStatus}`);

        if (checkOrder.status === 'CANCELLED' && checkOrder.paymentStatus === 'cancelled') {
            console.log('✅ TEST PASSED: Order successfully rolled back to CANCELLED state.');
        } else {
            console.error('❌ TEST FAILED: Order status not updated correctly.');
        }

        // 7. Cleanup (Optional: delete the test order)
        // await prisma.order.delete({ where: { id: order.id } });
        // console.log('🧹 Cleanup: Test order deleted.');

    } catch (error) {
        console.error('💥 Test Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testOrderRollback();
