
import { prisma } from '@/lib/prisma';
import { sendOrderStatusEmail, sendDeliveryFailedBuyerEmail, sendDeliveryFailedSellerEmail } from '@/lib/email';
import { getShippingProvider } from '@/services/shippingFactory';
import { normalizeStatus, UNIVERSAL_STATUS } from '@/lib/shipping/statusMapper';
import { receiveReturn } from '@/lib/services/returnsService';

/**
 * Syncs an order's status with the shipping provider (Lalamove)
 * Uses universal status mapping for consistent UI display
 * @param {string} orderId 
 * @returns {Promise<object>} Result of the sync operation
 */
export async function syncOrderStatus(orderId) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            user: true,
            store: true,
            returns: {
                where: { status: { in: ['BOOKED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RECEIVED', 'TO_PICKUP', 'SHIPPING'] } },
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        }
    });

    if (!order) throw new Error('Order not found');

    const activeReturn = order.returns?.[0];
    const isReturnSync = !!(activeReturn && activeReturn.returnShipping?.bookingId);

    // Determine which shipping data to use as base
    const shippingData = isReturnSync ? activeReturn.returnShipping : order.shipping;

    if (!shippingData?.bookingId || shippingData.provider !== 'lalamove') {
        throw new Error('Not a Lalamove booking or no booking ID found');
    }

    const lalamove = getShippingProvider('lalamove');
    const trackingResult = await lalamove.trackOrder(shippingData.bookingId);

    const currentLalamoveStatus = shippingData.status;
    const newLalamoveStatus = trackingResult.status;

    // Normalize to universal status
    const currentUniversalStatus = normalizeStatus(currentLalamoveStatus, 'lalamove', isReturnSync);
    const newUniversalStatus = normalizeStatus(newLalamoveStatus, 'lalamove', isReturnSync);

    let orderStatus = order.status;
    let updatedShipping = {
        ...shippingData,
        status: newLalamoveStatus, // Keep raw Lalamove status for debugging
        shareLink: trackingResult.shareLink || shippingData.shareLink || null,
        updatedAt: new Date().toISOString()
    };

    if (trackingResult.driverInfo) {
        updatedShipping.driverInfo = {
            name: trackingResult.driverInfo.name || null,
            phone: trackingResult.driverInfo.phone || null,
            plateNumber: trackingResult.driverInfo.plateNumber || null,
            photo: trackingResult.driverInfo.photo || null,
            vehicleType: trackingResult.driverInfo.vehicleType || null,
            rating: trackingResult.driverInfo.rating || null
        };
    }

    if (trackingResult.location) {
        updatedShipping.location = {
            ...trackingResult.location,
            lat: trackingResult.location.lat || null,
            lng: trackingResult.location.lng || null,
            updatedAt: new Date().toISOString()
        };
    }

    let emailSent = false;
    let statusChanged = newUniversalStatus !== currentUniversalStatus;

    if (statusChanged) {
        console.log(`[SyncService] ${isReturnSync ? 'Return' : 'Order'} ${isReturnSync ? activeReturn.id : orderId}: Status changed from ${currentUniversalStatus} to ${newUniversalStatus} (Lalamove: ${currentLalamoveStatus} → ${newLalamoveStatus})`);

        // Handle status changes based on UNIVERSAL status
        if (newUniversalStatus === UNIVERSAL_STATUS.TO_SHIP && !isReturnSync) {
            // Courier booked, waiting for pickup - keep as PROCESSING
            if (!['PROCESSING', 'TO_SHIP', 'SHIPPING', 'DELIVERED', 'COMPLETED'].includes(orderStatus)) {
                orderStatus = UNIVERSAL_STATUS.TO_SHIP;
            }
        } else if (newUniversalStatus === UNIVERSAL_STATUS.SHIPPING && !isReturnSync) {
            // Package picked up, in transit
            if (!['SHIPPING', 'DELIVERED', 'COMPLETED'].includes(orderStatus)) {
                orderStatus = UNIVERSAL_STATUS.SHIPPING;
            }
        } else if (newUniversalStatus === UNIVERSAL_STATUS.DELIVERED && !isReturnSync) {
            // Package delivered
            if (orderStatus !== 'DELIVERED' && orderStatus !== 'COMPLETED') {
                orderStatus = UNIVERSAL_STATUS.DELIVERED;
                const deliveredAt = new Date();
                const autoCompleteDate = new Date();
                autoCompleteDate.setDate(autoCompleteDate.getDate() + 3); // Standard 3 days

                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        status: orderStatus,
                        deliveredAt,
                        autoCompleteAt: autoCompleteDate,
                        shipping: updatedShipping
                    }
                });
            }
        } else if (newUniversalStatus === UNIVERSAL_STATUS.CANCELLED && !isReturnSync) {
            // Delivery cancelled/failed
            if (orderStatus !== 'COMPLETED' && orderStatus !== 'DELIVERED') {
                orderStatus = 'PROCESSING'; // Reset to allow rebooking
                updatedShipping.previousAttempts = [
                    ...(shippingData.previousAttempts || []),
                    {
                        bookingId: shippingData.bookingId,
                        failureReason: newLalamoveStatus,
                        failedAt: new Date().toISOString(),
                        status: 'INVALID'
                    }
                ];
                updatedShipping.failureReason = newLalamoveStatus;
                updatedShipping.failedAt = new Date().toISOString();
                updatedShipping.bookingId = null; // Clear to allow rebooking

                // Notify Buyer/Seller for main order failure
                await sendDeliveryFailedBuyerEmail(order.user.email, order, order.user, order.store, newLalamoveStatus);
                if (order.store.email) {
                    await sendDeliveryFailedSellerEmail(order.store.email, order, order.store, newLalamoveStatus);
                }
                emailSent = true;
            }
        }
    }

    // Update the correct record
    if (isReturnSync) {
        let returnStatusUpdate = activeReturn.status;

        if (newUniversalStatus === UNIVERSAL_STATUS.DELIVERED) {
            // Return completed - Lalamove delivered to seller. Auto-refund.
            await receiveReturn({
                returnId: activeReturn.id,
                storeId: order.storeId
            });
            returnStatusUpdate = UNIVERSAL_STATUS.REFUNDED;

            return {
                success: true,
                statusChanged: true,
                isReturn: true,
                oldStatus: currentUniversalStatus,
                newStatus: newUniversalStatus,
                lalamoveStatus: newLalamoveStatus,
                action: 'AUTO_REFUNDED'
            };
        }

        // Map universal status to return status
        if (newUniversalStatus === UNIVERSAL_STATUS.TO_PICKUP) {
            returnStatusUpdate = 'TO_PICKUP';
        } else if (newUniversalStatus === UNIVERSAL_STATUS.SHIPPING) {
            returnStatusUpdate = UNIVERSAL_STATUS.SHIPPING;
        } else if (newUniversalStatus === UNIVERSAL_STATUS.CANCELLED) {
            returnStatusUpdate = 'RETURN_APPROVED'; // Reset to allow rebooking
        }

        await prisma.return.update({
            where: { id: activeReturn.id },
            data: {
                status: returnStatusUpdate,
                returnShipping: updatedShipping
            }
        });

        // Update main order status to SHIPPING if return is picked up
        if (returnStatusUpdate === UNIVERSAL_STATUS.SHIPPING && orderStatus !== UNIVERSAL_STATUS.SHIPPING) {
            await prisma.order.update({
                where: { id: order.id },
                data: { status: UNIVERSAL_STATUS.SHIPPING }
            });
        }
    } else {
        await prisma.order.update({
            where: { id: order.id },
            data: {
                status: orderStatus,
                shipping: updatedShipping
            }
        });
    }

    if (statusChanged && !emailSent && !isReturnSync && [UNIVERSAL_STATUS.SHIPPING, UNIVERSAL_STATUS.DELIVERED].includes(orderStatus)) {
        await sendOrderStatusEmail(order.user.email, order, order.user, order.store, orderStatus);
    }

    return {
        success: true,
        statusChanged,
        isReturn: isReturnSync,
        oldStatus: currentUniversalStatus,
        newStatus: newUniversalStatus,
        lalamoveStatus: newLalamoveStatus
    };
}
