const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function restoreShareLink() {
    try {
        // Find the order with the Lalamove booking
        const order = await prisma.order.findFirst({
            where: {
                shipping: {
                    path: ['bookingId'],
                    equals: '3379141263969698228'
                }
            }
        });

        if (!order) {
            console.log('❌ Order not found');
            return;
        }

        console.log('✅ Order found:', order.id);
        console.log('Current shipping data:', JSON.stringify(order.shipping, null, 2));

        // Check if shareLink exists
        if (order.shipping.shareLink) {
            console.log('✅ ShareLink already exists:', order.shipping.shareLink);
        } else {
            console.log('❌ ShareLink is missing!');

            // We need to get it from Lalamove API
            console.log('\n📞 Fetching from Lalamove API...');

            const lalamoveOrderId = order.shipping.bookingId;

            // Import the Lalamove service
            const { getShippingProvider } = require('../../services/shippingFactory');
            const lalamove = getShippingProvider('lalamove');

            try {
                const trackingData = await lalamove.trackOrder(lalamoveOrderId);
                console.log('Tracking data:', JSON.stringify(trackingData, null, 2));

                if (trackingData.shareLink) {
                    // Update the order with the shareLink
                    const updated = await prisma.order.update({
                        where: { id: order.id },
                        data: {
                            shipping: {
                                ...order.shipping,
                                shareLink: trackingData.shareLink,
                                trackingUrl: trackingData.shareLink
                            }
                        }
                    });

                    console.log('✅ ShareLink restored:', trackingData.shareLink);
                } else {
                    console.log('⚠️ ShareLink not available in Lalamove API response');
                }
            } catch (error) {
                console.error('❌ Error fetching from Lalamove:', error.message);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

restoreShareLink();
