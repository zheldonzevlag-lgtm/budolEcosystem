// Debug script to check order shipping data
// Run this to see what data is actually stored for a Lalamove order

const orderId = process.argv[2];

if (!orderId) {
    console.log('Usage: node scripts/debug-order-shipping.js <orderId>');
    console.log('Example: node scripts/debug-order-shipping.js cmirwejfw003jm04ee7yw8rk');
    process.exit(1);
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugOrderShipping() {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                status: true,
                shipping: true,
                createdAt: true
            }
        });

        if (!order) {
            console.log(`❌ Order ${orderId} not found`);
            return;
        }

        console.log('\n=== ORDER SHIPPING DATA ===\n');
        console.log('Order ID:', order.id);
        console.log('Order Status:', order.status);
        console.log('Created:', order.createdAt);
        console.log('\n--- Shipping Object ---');
        console.log(JSON.stringify(order.shipping, null, 2));

        console.log('\n--- Key Fields Check ---');
        console.log('Provider:', order.shipping?.provider);
        console.log('Booking ID:', order.shipping?.bookingId);
        console.log('Status:', order.shipping?.status);
        console.log('Share Link:', order.shipping?.shareLink ? 'Present' : 'Missing');

        console.log('\n--- Driver Data ---');
        if (order.shipping?.driver) {
            console.log('✅ Driver data EXISTS');
            console.log(JSON.stringify(order.shipping.driver, null, 2));
        } else {
            console.log('❌ Driver data MISSING');
            console.log('\nThis is why the driver information card is not showing!');
            console.log('\nTo fix this, you need to:');
            console.log('1. Wait for Lalamove to assign a driver (webhook will update)');
            console.log('2. Or manually sync: GET /api/orders/' + orderId + '/sync-lalamove');
        }

        console.log('\n--- Location Data ---');
        if (order.shipping?.location) {
            console.log('✅ Location data EXISTS');
            console.log(JSON.stringify(order.shipping.location, null, 2));
        } else {
            console.log('❌ Location data MISSING');
        }

        console.log('\n--- ETA Data ---');
        console.log('Estimated Delivery Time:', order.shipping?.estimatedDeliveryTime || 'Missing');

        console.log('\n=========================\n');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

debugOrderShipping();
