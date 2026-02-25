import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import axios from 'axios';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000'; // Adjust as needed

async function testSyncLatency() {
    console.log('--- STARTING SYNC LATENCY TEST ---');

    try {
        // 1. Find a sample order that is in 'SHIPPED' or 'PROCESSING' status
        const order = await prisma.order.findFirst({
            where: {
                status: { in: ['SHIPPED', 'PROCESSING'] },
                shipping: { not: null }
            }
        });

        if (!order) {
            console.log('No suitable order found for testing. Please create an order with shipping info first.');
            return;
        }

        console.log(`Testing with Order ID: ${order.id}`);
        console.log(`Current Status: ${order.status}`);
        console.log(`Lalamove Order ID: ${order.shipping?.lalamoveOrderId}`);

        if (!order.shipping?.lalamoveOrderId) {
            console.log('Order does not have a Lalamove Order ID. Skipping.');
            return;
        }

        // 2. Prepare mock Lalamove webhook payload
        const payload = {
            data: {
                order: {
                    orderId: order.shipping.lalamoveOrderId,
                    status: 'COMPLETED' // Status that maps to DELIVERED
                }
            },
            timestamp: new Date().toISOString()
        };

        console.log('Sending mock Lalamove webhook payload...');
        const startTime = Date.now();

        try {
            const response = await axios.post(`${BASE_URL}/api/webhooks/lalamove`, payload, {
                headers: { 'Content-Type': 'application/json' }
            });

            const endTime = Date.now();
            const duration = endTime - startTime;

            console.log(`Webhook response: ${response.status} ${response.statusText}`);
            console.log(`Total duration: ${duration}ms`);

            if (duration < 1000) {
                console.log('✅ SYNC LATENCY IS WITHIN ACCEPTABLE RANGE (< 1s)');
            } else {
                console.log('⚠️ SYNC LATENCY EXCEEDS 1s. Optimization might be needed.');
            }

            // 3. Verify database update
            const updatedOrder = await prisma.order.findUnique({
                where: { id: order.id }
            });

            console.log(`Updated Status in DB: ${updatedOrder.status}`);

            if (updatedOrder.status === 'DELIVERED') {
                console.log('✅ DATABASE UPDATE VERIFIED');
            } else {
                console.log('❌ DATABASE UPDATE FAILED');
            }

        } catch (error) {
            console.error('Webhook request failed:', error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
            }
        }

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testSyncLatency();
