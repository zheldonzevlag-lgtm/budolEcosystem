const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function handlePaymentSuccess(data) {
    const paymentIntentId = data.id || data.paymentIntentId;
    const metadata = data.metadata || {};
    const orderId = metadata.orderId;

    console.log(`[Test Logic] Processing success for Order: ${orderId}, Intent: ${paymentIntentId}`);

    if (!orderId) {
        throw new Error('No orderId found in metadata');
    }

    // Find the order
    const order = await prisma.order.findUnique({
        where: { id: orderId }
    });

    if (!order) {
        throw new Error(`Order ${orderId} not found`);
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
            isPaid: true,
            status: 'PAID',
            paymentStatus: 'paid',
            paidAt: new Date(),
            paymentId: paymentIntentId
        }
    });

    console.log('✅ Order updated successfully:', updatedOrder.id);
    console.log('Status:', updatedOrder.status);
    console.log('isPaid:', updatedOrder.isPaid);
}

async function runTest() {
    const testData = {
        id: 'pi_test_final_verify',
        metadata: {
            orderId: 'cmjs9n6xc0015gp08a0bn2531'
        }
    };

    try {
        await handlePaymentSuccess(testData);
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

runTest();
