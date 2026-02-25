import { NextResponse } from 'next/server';
import { getShippingProvider } from '@/services/shippingFactory';
import { prisma } from '@/lib/prisma';
import { triggerRealtimeEvent } from '@/lib/realtime';
import { scheduleAutoComplete } from '@/lib/orderAutoComplete';
import { receiveReturn } from '@/lib/services/returnsService';
import { normalizeStatus, UNIVERSAL_STATUS } from '@/lib/shipping/statusMapper';

/**
 * POST /api/orders/[orderId]/sync-lalamove
 * Manually sync Lalamove order data (driver info, location, status)
 * And update the main Order Status if changed.
 */
export async function POST(request, { params }) {
    try {
        const { orderId } = await params;

        // Get the order
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Check if it's a Lalamove order
        if (order.shipping?.provider !== 'lalamove') {
            return NextResponse.json(
                { error: 'Not a Lalamove order' },
                { status: 400 }
            );
        }

        const lalamoveOrderId = order.shipping.bookingId;
        if (!lalamoveOrderId) {
            return NextResponse.json(
                { error: 'No Lalamove booking ID found' },
                { status: 400 }
            );
        }

        // Fetch latest data from Lalamove
        const lalamove = getShippingProvider('lalamove');
        const trackingData = await lalamove.trackOrder(lalamoveOrderId);

        console.log('[Sync Lalamove] Tracking data received:', trackingData);

        const lalamoveStatus = trackingData.status;

        // Prepare updated shipping data
        // STRICT PASSIVE MERGE: We only capture driver info once (usually via webhook or first assignment).
        // Polling (the trackOrder API) often misses details, so we MUST NOT overwrite what we have.
        const currentDriverInfo = order.shipping?.driverInfo || order.shipping?.driver || null;
        const newDriverInfo = trackingData.driverInfo;

        let mergedDriverInfo = currentDriverInfo;

        // Only update driver info if it's currently missing and the new data is substantial
        if (newDriverInfo && (!currentDriverInfo || !currentDriverInfo.name)) {
            console.log('[Sync Lalamove] Capturing initial driver info from sync');
            mergedDriverInfo = newDriverInfo;
        } else if (newDriverInfo && currentDriverInfo) {
            // If we have both, only update if the new data has fields the current one lacks
            // (e.g. adding a phone number or plate that was previously missing)
            mergedDriverInfo = {
                ...currentDriverInfo,
                driverId: trackingData.driverId || currentDriverInfo.driverId || null,
                name: (newDriverInfo.name && newDriverInfo.name !== "Lalamove Rider") ? newDriverInfo.name : (currentDriverInfo.name || null),
                phone: newDriverInfo.phone || currentDriverInfo.phone || null,
                plateNumber: newDriverInfo.plateNumber || currentDriverInfo.plateNumber || null,
                photo: newDriverInfo.photo || currentDriverInfo.photo || null,
                vehicleType: newDriverInfo.vehicleType || currentDriverInfo.vehicleType || null,
                rating: newDriverInfo.rating || currentDriverInfo.rating || null
            };
        }

        const updatedShipping = {
            ...order.shipping,
            status: lalamoveStatus,
            driverInfo: mergedDriverInfo,
            driver: mergedDriverInfo, // Keep legacy 'driver' sync'd
            // Only update location if we got valid coordinates (Lalamove sandbox sometimes sends 0,0)
            location: (trackingData.location && trackingData.location.lat !== 0 && trackingData.location.lng !== 0)
                ? trackingData.location
                : order.shipping?.location,
            shareLink: trackingData.shareLink || order.shipping?.shareLink,
            provider: 'lalamove',
            updatedAt: new Date().toISOString()
        };

        // Determine new Order Status based on Lalamove Status
        let newOrderStatus = order.status;
        let updateData = {
            shipping: updatedShipping
        };

        console.log('[Sync Lalamove] Mapping status:', {
            orderId: order.id,
            lalamoveStatus,
            currentOrderStatus: order.status,
            currentShippingStatus: order.shipping?.status
        });

        // Normalize Lalamove status to universal status
        const universalStatus = normalizeStatus(lalamoveStatus, 'lalamove', false);
        console.log('[Sync Lalamove] Normalized status:', { lalamoveStatus, universalStatus });

        // Handle status transitions based on UNIVERSAL status
        if (universalStatus === UNIVERSAL_STATUS.TO_SHIP) {
            // Courier booked, waiting for pickup
            if (['ORDER_PLACED', 'PENDING_VERIFICATION', 'PROCESSING'].includes(order.status)) {
                newOrderStatus = UNIVERSAL_STATUS.TO_SHIP;
                updateData.status = UNIVERSAL_STATUS.TO_SHIP;
                console.log('[Sync Lalamove] Transitioning to TO_SHIP (Courier Booked)');
            }
        }
        else if (universalStatus === UNIVERSAL_STATUS.SHIPPING) {
            // Package picked up, in transit
            if (![UNIVERSAL_STATUS.SHIPPING, UNIVERSAL_STATUS.DELIVERED, 'COMPLETED'].includes(order.status)) {
                newOrderStatus = UNIVERSAL_STATUS.SHIPPING;
                updateData.status = UNIVERSAL_STATUS.SHIPPING;
                if (!order.shippedAt) updateData.shippedAt = new Date();
                console.log('[Sync Lalamove] Transitioning to SHIPPING (Package Picked Up)');
            }
        } else if (universalStatus === UNIVERSAL_STATUS.DELIVERED) {
            // Package delivered
            // 🛑 Prevent reverting to DELIVERED if we are already in a Return Phase
            const isReturnPhase = ['RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_DISPUTED', 'REFUNDED'].includes(order.status);

            if (!isReturnPhase && order.status !== UNIVERSAL_STATUS.DELIVERED && order.status !== 'COMPLETED') {
                newOrderStatus = UNIVERSAL_STATUS.DELIVERED;
                updateData.status = UNIVERSAL_STATUS.DELIVERED;
                updateData.deliveredAt = new Date();

                console.log('[Sync Lalamove] Transitioning to DELIVERED');

                // Set auto-complete date (using dynamic protection window)
                await scheduleAutoComplete(orderId);
            }

            // For deferred payment methods, mark as paid when delivery is completed
            if (['COD', 'BUDOL_PAY'].includes(order.paymentMethod) && !order.isPaid) {
                updateData.isPaid = true;
                updateData.paymentStatus = 'paid';
                updateData.paidAt = new Date();
            }
        } else if (universalStatus === UNIVERSAL_STATUS.CANCELLED) {
            // Delivery cancelled/failed
            // Only revert if not already completed/delivered
            if (order.status !== 'COMPLETED' && order.status !== UNIVERSAL_STATUS.DELIVERED) {
                newOrderStatus = 'PROCESSING';
                updateData.status = 'PROCESSING';

                console.log('[Sync Lalamove] Reverting to PROCESSING and clearing bookingId due to failure/cancellation');

                // ARCHIVE FAILED BOOKING: Standard BudolShap Practice
                // Move failure info to previousAttempts and clear active bookingId
                const failedAttempt = {
                    bookingId: order.shipping?.bookingId,
                    status: lalamoveStatus,
                    failedAt: new Date().toISOString(),
                    failureReason: trackingData.failureReason || lalamoveStatus,
                    driverInfo: order.shipping?.driverInfo
                };

                const previousAttempts = Array.isArray(order.shipping?.previousAttempts)
                    ? [...order.shipping.previousAttempts, failedAttempt]
                    : [failedAttempt];

                // Update shipping object to clear active booking
                updatedShipping.bookingId = null;
                updatedShipping.quotationId = null;
                updatedShipping.trackingUrl = null;
                updatedShipping.shareLink = null;
                // 📝 Phase 2: Preserve driverInfo even on failure for history
                // updatedShipping.driverInfo = null; 
                updatedShipping.status = 'PENDING'; // Reset shipping status
                updatedShipping.previousAttempts = previousAttempts;

                // Add failure info for record
                updatedShipping.latestFailure = failedAttempt;
                updatedShipping.failureReason = lalamoveStatus;
                updatedShipping.failedAt = new Date().toISOString();
            }
        }

        console.log('[Sync Lalamove] Final update state:', {
            orderId: order.id,
            newOrderStatus,
            newShippingStatus: updatedShipping.status
        });

        // ... (Existing order update logic) ...

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: updateData,
            include: {
                user: { select: { id: true, name: true, email: true, image: true } },
                store: { select: { id: true, name: true, username: true, logo: true } },
                address: true,
                orderItems: {
                    include: { product: { select: { id: true, name: true, images: true, category: true, price: true } } }
                },
                // Include returns to return them in response
                returns: true
            }
        });

        // --- NEW: Sync Active Returns ---
        let updatedReturns = [];

        // Find any active returns associated with this order
        const returns = await prisma.return.findMany({
            where: {
                orderId: orderId,
                status: { in: ['BOOKED', 'PICKED_UP', 'IN_TRANSIT'] }
            },
            include: {
                order: true
            }
        });

        if (returns.length > 0) {
            console.log(`[Sync Lalamove] Found ${returns.length} active returns to sync`);
            const lalamoveProvider = getShippingProvider('lalamove');

            for (const ret of returns) {
                const returnBookingId = ret.returnShipping?.bookingId;
                if (!returnBookingId) continue;

                try {
                    console.log(`[Sync Lalamove] Syncing return ${ret.id} with booking ${returnBookingId}`);
                    const returnTracking = await lalamoveProvider.trackOrder(returnBookingId);

                    if (returnTracking && returnTracking.status) {
                        const loadingStatus = returnTracking.status;
                        let newReturnStatus = ret.status;
                        let returnUpdateData = {
                            returnShipping: {
                                ...ret.returnShipping,
                                status: loadingStatus,
                                updatedAt: new Date().toISOString()
                            }
                        };

                        // Update driver info if available
                        if (returnTracking.driverInfo) {
                            returnUpdateData.returnShipping.driverInfo = {
                                name: returnTracking.driverInfo.name || ret.returnShipping?.driverInfo?.name,
                                phone: returnTracking.driverInfo.phone || ret.returnShipping?.driverInfo?.phone,
                                plateNumber: returnTracking.driverInfo.plateNumber || ret.returnShipping?.driverInfo?.plateNumber,
                                photo: returnTracking.driverInfo.photo || ret.returnShipping?.driverInfo?.photo,
                                vehicleType: returnTracking.driverInfo.vehicleType || ret.returnShipping?.driverInfo?.vehicleType
                            };
                        }

                        // Map Status using standardized terminology
                        if (['PICKED_UP'].includes(loadingStatus)) {
                            newReturnStatus = 'PICKED_UP';
                        } else if (['IN_TRANSIT', 'ON_GOING', 'ON_THE_WAY'].includes(loadingStatus)) {
                            // If it's already PICKED_UP, moving to SHIPPED/IN_TRANSIT
                            if (ret.status === 'PICKED_UP' || ret.status === 'SHIPPED' || ret.status === 'IN_TRANSIT') {
                                newReturnStatus = UNIVERSAL_STATUS.SHIPPING;
                            } else {
                                // Preliminary movement (getting to customer)
                                newReturnStatus = 'TO_PICKUP';
                            }
                        } else if (['COMPLETED', 'DELIVERED', 'FINISHED', 'SUCCEEDED'].includes(loadingStatus)) {
                            // Standard Practice: Mark as DELIVERED (Arrived at Store)
                            // Let the seller inspect and click "RECEIVE" to trigger refund, 
                            // or let the cron sweep do it after 2 days.
                            newReturnStatus = 'DELIVERED';
                            console.log(`[Sync Lalamove] Return ${ret.id} delivered to store. Waiting for seller receipt.`);
                        } else if (['CANCELED', 'CANCELLED', 'EXPIRED', 'REJECTED'].includes(loadingStatus)) {
                            newReturnStatus = 'CANCELLED';
                        }

                        if (newReturnStatus !== ret.status && newReturnStatus !== 'REFUNDED') {
                            // If we auto-refunded, receiveReturn already updated DB
                            // If not refunded (e.g. IN_TRANSIT), update here
                            returnUpdateData.status = newReturnStatus;
                            console.log(`[Sync Lalamove] Updating return ${ret.id} status to ${newReturnStatus}`);

                            const updatedReturnRecord = await prisma.return.update({
                                where: { id: ret.id },
                                data: returnUpdateData
                            });
                            updatedReturns.push(updatedReturnRecord);
                        } else if (newReturnStatus === 'REFUNDED' && ret.status !== 'REFUNDED') {
                            // If auto-refunded successfully, push the updated record for frontend response
                            const updatedReturnRecord = await prisma.return.findUnique({ where: { id: ret.id } });
                            updatedReturns.push(updatedReturnRecord);
                        }
                    }
                } catch (returnError) {
                    console.error(`[Sync Lalamove] Failed to sync return ${ret.id}:`, returnError);
                }
            }
        }
        // --------------------------------

        // Trigger Realtime Update for both Seller and Buyer
        const eventData = {
            orderId: order.id,
            status: newOrderStatus,
            shippingStatus: lalamoveStatus,
            returnUpdates: updatedReturns.length > 0 ? updatedReturns : undefined
        };

        const realtimePromises = [
            triggerRealtimeEvent(`store-${order.storeId}`, 'order-updated', eventData),
            triggerRealtimeEvent(`user-${order.userId}`, 'order-updated', eventData)
        ];

        // Also trigger specific 'return-updated' events for the returns list
        if (updatedReturns.length > 0) {
            updatedReturns.forEach(ret => {
                realtimePromises.push(
                    triggerRealtimeEvent(`store-${order.storeId}`, 'return-updated', ret)
                );
            });
        }

        await Promise.all(realtimePromises);

        return NextResponse.json({
            success: true,
            message: 'Lalamove data synced successfully',
            order: updatedOrder,
            trackingData: trackingData,
            statusUpdated: newOrderStatus !== order.status,
            previousStatus: order.status,
            newStatus: newOrderStatus,
            updatedReturns: updatedReturns // Send back updated returns
        });

    } catch (error) {
        console.error('[Sync Lalamove] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to sync Lalamove data',
                details: error.message
            },
            { status: 500 }
        );
    }
}
