const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function viewShippingData() {
    try {
        const order = await prisma.order.findUnique({
            where: { id: 'cmit7vnqv0002kz049h850tmh' },
            select: {
                id: true,
                status: true,
                shipping: true
            }
        });

        if (order) {
            console.log('Order ID:', order.id);
            console.log('Status:', order.status);
            console.log('\n=== FULL SHIPPING OBJECT ===\n');
            console.log(JSON.stringify(order.shipping, null, 2));

            console.log('\n=== DEBUG: WEBHOOK PAYLOAD ===');
            console.log('Last Payload:', JSON.stringify(order.shipping?.lastWebhookPayload, null, 2));
            console.log('Last Error:', order.shipping?.lastWebhookError);

            console.log('\n=== DRIVER DATA CHECK ===');
            console.log('Has driver key:', 'driver' in (order.shipping || {}));
            console.log('Driver value:', order.shipping?.driver);

            console.log('\n=== LOCATION DATA CHECK ===');
            console.log('Has location key:', 'location' in (order.shipping || {}));
            console.log('Location value:', order.shipping?.location);

            console.log('\n=== TIMELINE CHECK ===');
            console.log('Has timeline:', 'timeline' in (order.shipping || {}));
            if (order.shipping?.timeline) {
                console.log('Timeline events:', order.shipping.timeline.length);
                order.shipping.timeline.forEach((event, i) => {
                    console.log(`\nEvent ${i + 1}:`);
                    console.log('  Type:', event.event);
                    console.log('  Status:', event.status);
                    console.log('  Timestamp:', event.timestamp);
                    console.log('  Has driver:', !!event.driver);
                    if (event.driver) {
                        console.log('  Driver:', event.driver);
                    }
                });
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

viewShippingData();
