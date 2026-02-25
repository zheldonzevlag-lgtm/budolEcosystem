
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getShippingProvider } from '@/services/shippingFactory';
import { sendOrderStatusEmail, sendDeliveryFailedBuyerEmail, sendDeliveryFailedSellerEmail } from '@/lib/email';
import { triggerRealtimeEvent } from '@/lib/realtime';

export async function POST(request, context) {
    try {
        // Next.js 13+ requires awaiting params
        const params = await context.params;
        const { orderId } = params;

        console.log('[Sync API] Received request for orderId:', orderId);

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: true,
                store: true,
                returns: {
                    where: { status: { in: ['BOOKED', 'SHIPPED', 'RECEIVED'] } },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const activeReturn = order.returns?.[0];
        const isReturnSync = !!(activeReturn && activeReturn.returnShipping?.bookingId);
        
        // Determine which shipping data to use as base
        const shippingData = isReturnSync ? activeReturn.returnShipping : order.shipping;

        if (!shippingData?.bookingId || shippingData.provider !== 'lalamove') {
            return NextResponse.json({ error: 'Not a Lalamove booking or no booking ID found' }, { status: 400 });
        }

        const lalamove = getShippingProvider('lalamove');
        let trackingResult;

        try {
            trackingResult = await lalamove.trackOrder(shippingData.bookingId);
        } catch (error) {
            return NextResponse.json({ error: 'Failed to fetch status from Lalamove', details: error.message }, { status: 502 });
        }

        const currentStatus = shippingData.status;
        const newStatus = trackingResult.status;

        // Prepare update data
        let orderStatus = order.status;
        let updatedShipping = {
            ...shippingData,
            status: newStatus,
            shareLink: trackingResult.shareLink || shippingData.shareLink || null,
            updatedAt: new Date().toISOString(),
            // Fix: Clear failure flags if status is valid (not failed)
            failureReason: ['CANCELLED', 'REJECTED', 'EXPIRED'].includes(newStatus) ? shippingData.failureReason : null,
            failedAt: ['CANCELLED', 'REJECTED', 'EXPIRED'].includes(newStatus) ? shippingData.failedAt : null,
            cancellationReason: ['CANCELLED', 'REJECTED', 'EXPIRED'].includes(newStatus) ? shippingData.cancellationReason : null,
            cancelledAt: ['CANCELLED', 'REJECTED', 'EXPIRED'].includes(newStatus) ? shippingData.cancelledAt : null
        };

        // Update driver info if available
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

        // Update location if available
        if (trackingResult.location) {
            updatedShipping.location = {
                ...trackingResult.location,
                lat: trackingResult.location.lat || null,
                lng: trackingResult.location.lng || null,
                updatedAt: new Date().toISOString()
            };
        }

        let emailSent = false;
        let statusChanged = false;

        // Logic: Force update if status changed OR if it's a failure status and we still have a bookingId (stuck cleanup)
        const isFailureStatus = ['CANCELED', 'CANCELLED', 'EXPIRED', 'REJECTED'].includes(newStatus);
        const needsCleanup = isFailureStatus && shippingData?.bookingId;

        if (newStatus !== currentStatus || needsCleanup) {
            statusChanged = true;
            console.log(`Sync: Processing update for ${isReturnSync ? 'return' : 'order'} ${isReturnSync ? activeReturn.id : order.id}. Status changed: ${newStatus !== currentStatus}, Cleanup: ${needsCleanup}`);

            if (newStatus === 'PICKED_UP') {
                if (orderStatus !== 'IN_TRANSIT' && orderStatus !== 'DELIVERED' && orderStatus !== 'COMPLETED') {
                    orderStatus = 'IN_TRANSIT';
                    if (!isReturnSync) {
                        // Only update shippedAt for original order
                        // No returnShippedAt field in Return model yet
                    }
                }
            } else if (newStatus === 'COMPLETED' || newStatus === 'DELIVERED') {
                if (!isReturnSync) {
                    if (orderStatus !== 'DELIVERED' && orderStatus !== 'COMPLETED') {
                        orderStatus = 'DELIVERED';
                        const deliveredAt = new Date();
                        const autoCompleteDate = new Date();
                        autoCompleteDate.setDate(autoCompleteDate.getDate() + 3);
                        
                        await prisma.order.update({
                            where: { id: order.id },
                            data: {
                                status: orderStatus,
                                deliveredAt,
                                autoCompleteAt: autoCompleteDate
                            }
                        });
                    }
                } else {
                    // Return completed - handled in return status update logic below
                }
            } else if (['CANCELED', 'CANCELLED', 'EXPIRED', 'REJECTED'].includes(newStatus)) {
                if (orderStatus !== 'COMPLETED' && orderStatus !== 'DELIVERED') {
                    if (!isReturnSync) {
                        orderStatus = 'PROCESSING';
                        console.log(`[Sync API] Order ${order.id} cancelled by Lalamove (${newStatus}). Moving to PROCESSING and clearing bookingId.`);

                        const failedAttempt = {
                            bookingId: shippingData?.bookingId,
                            status: newStatus,
                            failedAt: new Date().toISOString(),
                            failureReason: newStatus,
                            driverInfo: shippingData?.driverInfo
                        };

                        updatedShipping = {
                            ...updatedShipping,
                            bookingId: null,
                            quotationId: null,
                            trackingUrl: null,
                            shareLink: null,
                            driverInfo: null,
                            status: 'PENDING',
                            previousAttempts: [
                                ...(shippingData?.previousAttempts || []),
                                failedAttempt
                            ],
                            failureReason: newStatus,
                            failedAt: new Date().toISOString()
                        };

                        // Send failure emails
                        await sendDeliveryFailedBuyerEmail(order.user.email, order, order.user, order.store, newStatus);
                        if (order.store.email) {
                            await sendDeliveryFailedSellerEmail(order.store.email, order, order.store, newStatus);
                        }
                        emailSent = true;
                    } else {
                        // Return failed - move return status back to APPROVED so buyer can rebook
                    }
                }
            }
        }

        // Apply updates to the correct record
        if (isReturnSync) {
            let returnStatusUpdate = activeReturn.status;
            if (newStatus === 'PICKED_UP') returnStatusUpdate = 'SHIPPED';
            else if (newStatus === 'COMPLETED') returnStatusUpdate = 'RECEIVED';
            else if (['CANCELLED', 'EXPIRED', 'REJECTED'].includes(newStatus)) returnStatusUpdate = 'APPROVED';

            await prisma.return.update({
                where: { id: activeReturn.id },
                data: {
                    status: returnStatusUpdate,
                    returnShipping: updatedShipping
                }
            });

            // Update main order status to IN_TRANSIT if return is on the way
            if (returnStatusUpdate === 'SHIPPED' && orderStatus !== 'IN_TRANSIT') {
                await prisma.order.update({
                    where: { id: order.id },
                    data: { status: 'IN_TRANSIT' }
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

        // Trigger Realtime Update for both Seller and Buyer
        const eventData = {
            orderId: order.id,
            status: orderStatus,
            shippingStatus: newStatus,
            isReturn: isReturnSync,
            isPaid: order.isPaid,
            paymentStatus: order.paymentStatus,
            shipping: updatedShipping
        };

        const realtimePromises = [
            triggerRealtimeEvent(`store-${order.storeId}`, 'order-updated', eventData),
            triggerRealtimeEvent(`user-${order.userId}`, 'order-updated', eventData)
        ];

        if (isReturnSync) {
            const returnEventData = {
                ...eventData,
                returnId: activeReturn.id,
                status: activeReturn.status,
                shipping: updatedShipping // returnShipping
            };
            realtimePromises.push(triggerRealtimeEvent(`store-${order.storeId}`, 'return-updated', returnEventData));
            realtimePromises.push(triggerRealtimeEvent(`user-${order.userId}`, 'return-updated', returnEventData));
        }

        await Promise.all(realtimePromises);

        // Send generic status update email if status changed (and not already handled by failure email)
        if (statusChanged && !emailSent && !isReturnSync && ['IN_TRANSIT', 'DELIVERED'].includes(orderStatus)) {
            await sendOrderStatusEmail(order.user.email, order, order.user, order.store, orderStatus);
        }

        return NextResponse.json({
            success: true,
            synced: true,
            isReturn: isReturnSync,
            statusChanged,
            oldStatus: currentStatus,
            newStatus: newStatus
        });

    } catch (error) {
        console.error('Sync error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
