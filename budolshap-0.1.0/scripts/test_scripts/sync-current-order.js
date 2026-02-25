require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.lalamove' });
const { PrismaClient } = require('@prisma/client');
const Lalamove = require('../../services/lalamove');

// Hardcode DB URL to ensure connection
process.env.DATABASE_URL = "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhY2NlbGVyYXRlX3VybCI6Imh0dHBzOi8vYWNjZWxlcmF0ZS5wcmlzbWEtZGF0YS5uZXQiLCJhcGlfa2V5IjoiY2FjaGVfcHJveHlfY29ubmVjdGlvbl9wb29sX2NsYWl0X2NsaWVudF9pZF9jb25uZWN0aW9uX3N0cmluZyJ9";

const prisma = new PrismaClient();
const lalamove = new Lalamove();

async function syncOrder() {
    const internalOrderId = 'cmiskv4yh0002jl04p2bvgzb9'; // From screenshot URL

    console.log(`Syncing order: ${internalOrderId}`);

    try {
        const order = await prisma.order.findUnique({
            where: { id: internalOrderId }
        });

        if (!order) {
            console.error('Order not found!');
            return;
        }

        const lalamoveOrderId = order.shipping?.bookingId;
        console.log(`Lalamove Booking ID: ${lalamoveOrderId}`);

        if (!lalamoveOrderId) {
            console.error('No Lalamove booking ID found.');
            return;
        }

        console.log('Fetching data from Lalamove API...');
        const trackResult = await lalamove.trackOrder(lalamoveOrderId);
        console.log('Lalamove API Result:', JSON.stringify(trackResult, null, 2));

        const currentShipping = order.shipping || {};
        const updatedShipping = {
            ...currentShipping,
            driver: trackResult.driver || currentShipping.driver,
            status: trackResult.status || currentShipping.status,
            location: trackResult.location || currentShipping.location,
            shareLink: trackResult.shareLink || currentShipping.shareLink,
            updatedAt: new Date().toISOString()
        };

        await prisma.order.update({
            where: { id: internalOrderId },
            data: { shipping: updatedShipping }
        });

        console.log('Order synced successfully!');
        console.log('Driver:', updatedShipping.driver);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

syncOrder();
