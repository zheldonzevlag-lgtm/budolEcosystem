import { PrismaClient } from '@prisma/client';
import { getShippingProvider } from '../services/shippingFactory.js';
import { normalizeStatus, UNIVERSAL_STATUS } from '../lib/shipping/statusMapper.js';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Order Sync Test ---');
    const order = await prisma.order.findFirst({
        where: {
            user: {
                name: { contains: 'Natasha' }
            }
        }
    });

    if (!order) {
        console.log('No order found for Natasha');
        return;
    }

    console.log('Order ID:', order.id);
    console.log('Current Main Status:', order.status);
    console.log('Current Shipping Status:', order.shipping?.status);

    const lalamoveOrderId = order.shipping.bookingId;
    const lalamove = getShippingProvider('lalamove');

    console.log('Calling Lalamove trackOrder for:', lalamoveOrderId);
    const trackingData = await lalamove.trackOrder(lalamoveOrderId);
    console.log('Lalamove Raw Status:', trackingData.status);

    const universalStatus = normalizeStatus(trackingData.status, 'lalamove', false);
    console.log('Normalized Universal Status:', universalStatus);

    let newOrderStatus = order.status;
    let updateData = {
        shipping: {
            ...order.shipping,
            status: trackingData.status,
            updatedAt: new Date().toISOString()
        }
    };

    if (universalStatus === UNIVERSAL_STATUS.SHIPPING) {
        if (![UNIVERSAL_STATUS.SHIPPING, UNIVERSAL_STATUS.DELIVERED, 'COMPLETED'].includes(order.status)) {
            newOrderStatus = UNIVERSAL_STATUS.SHIPPING;
            updateData.status = UNIVERSAL_STATUS.SHIPPING;
            updateData.shippedAt = new Date();
            console.log('MATCH! Transitioning to SHIPPING');
        } else {
            console.log('Order already in SHIPPING or later status:', order.status);
        }
    } else {
        console.log('No transition rule for universal status:', universalStatus);
    }

    if (updateData.status) {
        console.log('Updating database...');
        const updated = await prisma.order.update({
            where: { id: order.id },
            data: updateData
        });
        console.log('Database updated successfully. New Status:', updated.status);
    } else {
        console.log('No database update needed for status transformation.');
        // Still update the shipping internal status
        await prisma.order.update({
            where: { id: order.id },
            data: updateData
        });
        console.log('Updated internal shipping status to:', trackingData.status);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
