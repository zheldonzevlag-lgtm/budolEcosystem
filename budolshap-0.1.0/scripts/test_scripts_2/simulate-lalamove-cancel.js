/**
 * Simulate Lalamove Order Cancellation
 * Usage: node scripts/simulate-lalamove-cancel.js <orderId>
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simulateCancellation() {
    const orderId = process.argv[2];

    if (!orderId) {
        console.error('❌ Please provide an order ID');
        process.exit(1);
    }

    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            console.error('❌ Order not found');
            process.exit(1);
        }

        console.log(`Initial Status: ${order.status}`);

        // Simulate cancellation similar to webhook
        const updatedShipping = {
            ...order.shipping,
            status: 'CANCELED',
            lastEvent: 'CANCELED',
            failueReason: 'CANCELED_BY_DRIVER', // Intentional typo fix in next step if field name is strictly 'failureReason'
            failureReason: 'CANCELED_BY_DRIVER',
            failedAt: new Date().toISOString(),
            previousAttempts: [
                ...(order.shipping?.previousAttempts || []),
                {
                    status: 'INVALID',
                    failureReason: 'CANCELED_BY_DRIVER',
                    failedAt: new Date().toISOString()
                }
            ]
        };

        const updated = await prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'PROCESSING', // Backend keeps it as PROCESSING
                shipping: updatedShipping
            }
        });

        console.log('✅ Simulation Complete');
        console.log(`Order Status: ${updated.status} (Should be PROCESSING)`);
        console.log(`Failure Reason: ${updated.shipping.failureReason}`);
        console.log('👉 Now check the Seller Dashboard (Cancelled Tab) and Buyer Tracking (Red Cross)');

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

simulateCancellation();
