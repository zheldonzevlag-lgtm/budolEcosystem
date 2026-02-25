
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cancelOrder } from '@/lib/services/ordersService';

export async function GET() {
    console.log('🚀 Starting Order Rollback API Test...');

    try {
        // 1. Find a test user and address
        const user = await prisma.user.findFirst({
            where: { email: { contains: '@' } },
            include: { Address: true }
        });

        if (!user || !user.Address[0]) {
            return NextResponse.json({ success: false, error: 'Test user or address not found' }, { status: 404 });
        }

        const address = user.Address[0];
        
        // 2. Find a test product
        const product = await prisma.product.findFirst({
            where: { inStock: true }
        });

        if (!product) {
            return NextResponse.json({ success: false, error: 'Test product not found' }, { status: 404 });
        }

        // 3. Create a mock order
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

        // 4. Simulate Rollback/Cancellation
        console.log('🔄 Simulating order cancellation...');
        await cancelOrder(order.id, true);

        // 5. Verify order status is CANCELLED
        const checkOrder = await prisma.order.findUnique({ where: { id: order.id } });
        
        const passed = checkOrder.status === 'CANCELLED' && checkOrder.paymentStatus === 'cancelled';

        // 6. Cleanup
        await prisma.order.delete({ where: { id: order.id } });
        console.log('🧹 Cleanup: Test order deleted.');

        if (passed) {
            return NextResponse.json({ 
                success: true, 
                message: 'Order successfully rolled back to CANCELLED state.',
                finalStatus: checkOrder.status,
                finalPaymentStatus: checkOrder.paymentStatus
            });
        } else {
            return NextResponse.json({ 
                success: false, 
                message: 'Order status not updated correctly.',
                finalStatus: checkOrder.status,
                finalPaymentStatus: checkOrder.paymentStatus
            }, { status: 500 });
        }

    } catch (error) {
        console.error('💥 Test Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
