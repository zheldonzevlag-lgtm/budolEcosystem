require('dotenv').config({ path: '.env.production' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function injectDriverInfo() {
    try {
        // 1. Find the most recent order to test with
        const order = await prisma.order.findFirst({
            orderBy: { createdAt: 'desc' },
            where: {
                // Option 1: Find a real Lalamove order
                // shipping: {
                //   path: ['provider'],
                //   equals: 'lalamove'
                // }
                // Option 2: Just find the latest active order to force-test
                NOT: {
                    status: { in: ['CANCELLED', 'COMPLETED', 'REFUNDED'] }
                }
            }
        });

        if (!order) {
            console.log('No suitable active order found to update.');
            return;
        }

        console.log(`Updating order: ${order.id}`);

        // 2. Prepare the shipping data object
        const currentShipping = order.shipping || {};

        // Ensure we keep existing important fields like address matches if they exist, 
        // but here we primarily want to overwrite/set the driver info.

        const updatedShipping = {
            ...currentShipping,
            provider: 'lalamove', // Ensure provider is lalamove
            status: 'ON_GOING',   // Set internal shipping status to active
            shareLink: 'https://www.lalamove.com/tracking?id=TEST_TRACKING_LINK', // Dummy link to trigger map view
            estimatedDeliveryTime: new Date(Date.now() + 30 * 60000).toISOString(), // +30 mins

            // The Driver Object
            driver: {
                name: 'Juan Dela Cruz',
                phone: '0917-123-4567',
                plateNumber: 'ABC 1234',
                vehicleType: 'MOTORCYCLE',
                rating: 4.8,
                photo: null // or a URL if we had one
            },

            // The Location Object
            location: {
                lat: 14.5995, // Manila approximate
                lng: 120.9842,
                updatedAt: new Date().toISOString()
            },

            // Ensure we have a booking ID so the sync logic attempts to run (though it will fail on a fake ID, but that's fine for UI testing)
            bookingId: currentShipping.bookingId || 'TEST_BOOKING_ID'
        };

        // 3. Update the order
        await prisma.order.update({
            where: { id: order.id },
            data: {
                shipping: updatedShipping,
                // Also ensure main status supports tracking view (e.g., SHIPPED or PROCESSING)
                status: order.status === 'ORDER_PLACED' ? 'PROCESSING' : order.status
            }
        });

        console.log('Successfully injected driver info!');
        console.log('Order ID:', order.id);
        console.log('Driver Name:', updatedShipping.driver.name);
        console.log('Please check the tracking page for this order.');

    } catch (error) {
        console.error('Error injecting driver info:', error);
    } finally {
        await prisma.$disconnect();
    }
}

injectDriverInfo();
