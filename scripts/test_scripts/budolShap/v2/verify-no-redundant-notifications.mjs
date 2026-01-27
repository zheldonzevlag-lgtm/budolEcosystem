
import { prisma } from '../../../../budolshap-0.1.0/lib/prisma.js';
import { updateOrderStatus } from '../../../../budolshap-0.1.0/lib/services/ordersService.js';
import { updateShippingStatus } from '../../../../budolshap-0.1.0/lib/services/shippingService.js';

async function verifyNoRedundantNotifications() {
    console.log('--- Verifying No Redundant Notifications ---');

    // 1. Find a test order
    const order = await prisma.order.findFirst({
        orderBy: { createdAt: 'desc' }
    });

    if (!order) {
        console.log('No order found to test.');
        return;
    }

    console.log(`Testing with Order ID: ${order.id}, Status: ${order.status}`);

    // 2. Try updating with the SAME status
    console.log('\n[Test 1] Updating with SAME status (should skip realtime event)');
    const result1 = await updateOrderStatus(order.id, { status: order.status });
    console.log('Result 1: Update completed (check logs for skip message)');

    // 3. Try updating with DIFFERENT status
    const nextStatus = order.status === 'ORDER_PLACED' ? 'PROCESSING' : 'ORDER_PLACED';
    console.log(`\n[Test 2] Updating with DIFFERENT status: ${nextStatus} (should trigger realtime event)`);
    const result2 = await updateOrderStatus(order.id, { status: nextStatus });
    console.log('Result 2: Update completed');

    // 4. Try updating with SAME status again
    console.log(`\n[Test 3] Updating with SAME status again: ${nextStatus} (should skip realtime event)`);
    const result3 = await updateOrderStatus(order.id, { status: nextStatus });
    console.log('Result 3: Update completed');

    console.log('\n--- Verification Finished ---');
}

verifyNoRedundantNotifications()
    .catch(err => {
        console.error('Verification failed:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
