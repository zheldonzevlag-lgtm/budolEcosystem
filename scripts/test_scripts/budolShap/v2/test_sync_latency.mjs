import { PrismaClient } from '../../../../budolshap-0.1.0/node_modules/@prisma/client/index.js';
const prisma = new PrismaClient();

const BASE_URL = 'http://localhost:3000';

async function testSyncLatency() {
    console.log('\n--- STARTING SYNC LATENCY TEST ---');
    console.log('Testing optimization: Reduced cache (1min -> 10s) and Parallel triggering');

    try {
        // 1. Check Realtime Config
        const configRes = await fetch(`${BASE_URL}/api/system/realtime`);
        const config = await configRes.json();
        console.log('Current Realtime Config:', config);

        if (config.provider !== 'PUSHER') {
            console.log('WARNING: Test is most effective when PUSHER is enabled.');
        }

        // 2. Find an order to update
        const order = await prisma.order.findFirst({
            where: { 
                status: { in: ['PROCESSING', 'SHIPPED'] },
                shipping: { not: null }
            }
        });

        if (!order) {
            console.log('No order with shipping data found.');
            return;
        }

        console.log('Order Shipping Data:', JSON.stringify(order.shipping, null, 2));
        const bookingId = order.shipping?.bookingId;
        console.log(`Testing with Order ID: ${order.id}, Booking ID: ${bookingId}`);

        if (!bookingId) {
            console.log('Order found but no bookingId in shipping JSON. Cannot proceed with webhook simulation.');
            return;
        }

        // 3. Simulate Lalamove Webhook (COMPLETED status)
        console.log('Simulating Lalamove Webhook: COMPLETED status...');
        
        const webhookPayload = {
            data: {
                order: {
                    orderId: bookingId,
                    status: 'COMPLETED'
                }
            }
        };

        const startTime = Date.now();
        const webhookRes = await fetch(`${BASE_URL}/api/webhooks/lalamove`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-lalamove-signature': 'test-signature-bypass',
                'x-test-bypass': 'budol-test-v503'
            },
            body: JSON.stringify(webhookPayload)
        });

        const webhookResult = await webhookRes.json();
        const duration = Date.now() - startTime;
        
        console.log('Webhook Response:', webhookResult);
        console.log(`Webhook Processing Duration: ${duration}ms`);

        // 4. Verify DB update
        const updatedOrder = await prisma.order.findUnique({
            where: { id: order.id }
        });

        console.log('New Order Status in DB:', updatedOrder.status);

        if (updatedOrder.status === 'DELIVERED') {
            console.log('SUCCESS: Order status synced to DELIVERED in DB.');
        } else {
            console.log('FAILURE: Order status not updated in DB.');
        }

        console.log('\n--- LATENCY VERIFICATION ---');
        console.log('The fix involved:');
        console.log('1. Parallelizing triggerRealtimeEvent calls (Promise.all)');
        console.log('2. Reducing Settings Cache TTL from 60s to 10s');
        console.log('3. Implementing clearSettingsCache on settings update');
        
        if (duration < 1000) {
            console.log(`EXCELLENT: Webhook processed in ${duration}ms (sub-second latency).`);
        } else if (duration < 2000) {
            console.log(`GOOD: Webhook processed in ${duration}ms.`);
        } else {
            console.log(`NOTE: Webhook took ${duration}ms. Check server load.`);
        }

    } catch (error) {
        console.error('Test Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testSyncLatency();
