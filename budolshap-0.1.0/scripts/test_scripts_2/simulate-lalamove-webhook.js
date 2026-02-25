const axios = require('axios');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

// Parse command line arguments
const args = process.argv.slice(2);
const isProd = args.includes('--prod');
const customUrlIndex = args.indexOf('--url');
const customUrl = customUrlIndex !== -1 ? args[customUrlIndex + 1] : null;

const BASE_URL = customUrl || (isProd ? 'https://budolshap.vercel.app' : (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'));
const WEBHOOK_SECRET = process.env.LALAMOVE_WEBHOOK_SECRET;

console.log(`🎯 Target URL: ${BASE_URL}`);

if (!WEBHOOK_SECRET) {
    console.error('❌ Error: LALAMOVE_WEBHOOK_SECRET is not set in .env file');
    process.exit(1);
}

async function createDummyOrder() {
    console.log('📝 Creating dummy order...');

    // Find a user and store
    const user = await prisma.user.findFirst();
    const store = await prisma.store.findFirst();

    if (!user || !store) {
        throw new Error('No user or store found in database to create dummy order');
    }

    const orderId = `TEST_ORDER_${Date.now()}`;
    const bookingId = `LALAMOVE_BOOKING_${Date.now()}`;

    const order = await prisma.order.create({
        data: {
            id: orderId,
            userId: user.id,
            storeId: store.id,
            total: 1000,
            status: 'PAID',
            paymentStatus: 'paid',
            paymentMethod: 'GCASH',
            shipping: {
                provider: 'lalamove',
                bookingId: bookingId,
                status: 'ASSIGNING_DRIVER'
            },
            items: {
                create: [] // Empty items for simplicity
            }
        }
    });

    console.log(`✅ Dummy order created: ${order.id}`);
    console.log(`   Booking ID: ${bookingId}`);
    return { orderId: order.id, bookingId };
}

async function sendWebhook(event, bookingId, status) {
    console.log(`\n🚀 Sending ${event} webhook...`);

    const payload = {
        event: event,
        orderId: bookingId,
        status: status,
        driver: {
            name: "Test Driver",
            phone: "+639171234567",
            plateNumber: "ABC 1234"
        },
        location: {
            lat: 14.5,
            lng: 121.0
        },
        timestamp: new Date().toISOString()
    };

    const body = JSON.stringify(payload);
    const signature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

    try {
        const response = await axios.post(`${BASE_URL}/api/webhooks/lalamove`, payload, {
            headers: {
                'x-lalamove-signature': signature,
                'Content-Type': 'application/json'
            }
        });

        console.log(`✅ Webhook sent. Status: ${response.status}`);
        return response.data;
    } catch (error) {
        console.error(`❌ Webhook failed: ${error.message}`);
        if (error.response) {
            console.error('   Response:', error.response.data);
        }
        throw error;
    }
}

async function verifyOrderStatus(orderId, expectedStatus) {
    console.log(`🔍 Verifying order status is ${expectedStatus}...`);

    // Wait a bit for DB update
    await new Promise(resolve => setTimeout(resolve, 1000));

    const order = await prisma.order.findUnique({
        where: { id: orderId }
    });

    if (order.status === expectedStatus) {
        console.log(`✅ Verification PASSED: Order status is ${order.status}`);
        if (expectedStatus === 'SHIPPED' && order.shippedAt) {
            console.log(`   shippedAt: ${order.shippedAt}`);
        }
        if (expectedStatus === 'DELIVERED' && order.deliveredAt) {
            console.log(`   deliveredAt: ${order.deliveredAt}`);
            console.log(`   autoCompleteAt: ${order.autoCompleteAt}`);
        }
        return true;
    } else {
        console.error(`❌ Verification FAILED: Order status is ${order.status}, expected ${expectedStatus}`);
        return false;
    }
}

async function main() {
    try {
        console.log('🧪 Starting Phase 2 Webhook Simulation');
        console.log('======================================');

        // 1. Create Dummy Order
        const { orderId, bookingId } = await createDummyOrder();

        // 2. Simulate PICKED_UP -> SHIPPED
        await sendWebhook('PICKED_UP', bookingId, 'PICKED_UP');
        await verifyOrderStatus(orderId, 'SHIPPED');

        // 3. Simulate COMPLETED -> DELIVERED
        await sendWebhook('COMPLETED', bookingId, 'COMPLETED');
        await verifyOrderStatus(orderId, 'DELIVERED');

        console.log('\n🎉 Test completed successfully!');

        // Cleanup
        console.log('\n🧹 Cleaning up...');
        await prisma.order.delete({ where: { id: orderId } });
        console.log('✅ Dummy order deleted');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('⚠️  Is the server running? Make sure to run "npm run dev" in another terminal.');
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
