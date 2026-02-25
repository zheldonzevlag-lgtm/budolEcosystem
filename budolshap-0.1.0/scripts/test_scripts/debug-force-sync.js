
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Lalamove = require('../../services/lalamove'); // Adjust path as needed

async function forceSyncOrder(orderId) {
    try {
        console.log(`Checking order: ${orderId}`);
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            console.error('Order not found!');
            return;
        }

        console.log('Current Status:', order.status);
        console.log('Shipping Booking ID:', order.shipping?.bookingId);

        if (!order.shipping?.bookingId) {
            console.error('No Lalamove Booking ID found.');
            return;
        }

        const lalamove = new Lalamove();
        console.log('Fetching status from Lalamove API...');
        const result = await lalamove.trackOrder(order.shipping.bookingId);

        console.log('Lalamove Result:', JSON.stringify(result, null, 2));

        if (result.status === 'PICKED_UP') {
            console.log('✅ Matched Status: PICKED_UP');
            console.log('This should map to IN_TRANSIT');
        } else {
            console.log(`Status is: ${result.status}`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Order ID from user screenshot URL: budolshap.vercel.app/orders/cmja63b3k0002l4047py271lt
forceSyncOrder('cmja63b3k0002l4047py271lt');
