import { NextResponse } from 'next/server';
import { getShippingProvider } from '@/services/shippingFactory';
import { prisma } from '@/lib/prisma';
import { sendOrderStatusEmail } from '@/lib/email';
import { receiveReturn } from '@/lib/services/returnsService';
import { triggerRealtimeEvent } from '@/lib/realtime';
import { getNowUTC } from '@/lib/dateUtils';
import { normalizeStatus, UNIVERSAL_STATUS } from '@/lib/shipping/statusMapper';
import { createAuditLog } from '@/lib/audit';

/**
 * POST /api/webhooks/lalamove
 * Receive webhook events from Lalamove
 * 
 * Events:
 * - ASSIGNING_DRIVER: Looking for a driver
 * - ON_GOING: Driver assigned
 * - PICKED_UP: Package picked up
 * - IN_TRANSIT: In transit to destination
 * - COMPLETED: Delivered successfully
 * - CANCELLED: Order cancelled
 * - REJECTED: Order rejected
 * - EXPIRED: Order expired
 */
export async function POST(request) {
    let webhookEventId = null;
    let lalamoveOrderId = null;
    let event = 'unknown';

    try {
        // Get raw body for signature verification
        const rawBody = await request.text();
        const signature = request.headers.get('x-lalamove-signature');
        
        // Parse webhook payload early for logging
        let payload;
        try {
            payload = JSON.parse(rawBody);
            
            // Extract IDs for logging
            if (payload.data && payload.data.order) {
                lalamoveOrderId = payload.data.order.orderId;
                event = payload.data.order.status;
            } else {
                lalamoveOrderId = payload.orderId;
                event = payload.status;
            }
        } catch (e) {
            console.error('Failed to parse webhook body for logging', e);
        }

        // 1. Log to Database (Pending)
        try {
            const webhookLog = await prisma.webhookEvent.create({
                data: {
                    provider: 'lalamove',
                    eventType: event || 'unknown',
                    payload: payload || { raw: rawBody },
                    status: 'PENDING',
                    // We don't have our internal orderId yet, but we have lalamoveOrderId in payload
                }
            });
            webhookEventId = webhookLog.id;
        } catch (dbError) {
            console.error('Failed to create webhook log:', dbError);
        }

        if (!signature) {
            console.error('Webhook signature missing');
            // Update log to FAILED
            if (webhookEventId) {
                await prisma.webhookEvent.update({
                    where: { id: webhookEventId },
                    data: { status: 'FAILED', error: 'Signature missing' }
                }).catch(console.error);
            }
            return NextResponse.json(
                { error: 'Signature missing' },
                { status: 401 }
            );
        }

        // Get Lalamove provider for signature verification
        const lalamove = getShippingProvider('lalamove');

        // Verify webhook signature
        const isValid = lalamove.verifyWebhookSignature(rawBody, signature);
        // const isValid = true; // BYPASS FOR V3 TESTING
        // const isValid = true; // BYPASS REMOVED

        if (!isValid) {
            console.error('Invalid webhook signature');
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        // Parse webhook payload
        // const payload = JSON.parse(rawBody); // Already parsed above

        console.log('Lalamove webhook received (Raw):', JSON.stringify(payload, null, 2));

        let lalamoveOrderId, event, status, driver, location, estimatedDeliveryTime, actualDeliveryTime;

        // Check for Lalamove v3 Payload Structure
        if (payload.data && payload.data.order) {
            console.log('Detected Lalamove v3 Payload');
            lalamoveOrderId = payload.data.order.orderId;
            status = payload.data.order.status;
            event = status; // Map status to event for providing compatibility with switch logic

            // Extract driver info if available in v3
            if (payload.data.order.driverId) {
                // v3 sends driverId, we might need to fetch details or checking if driver object exists
                // Some v3 payloads might include driver details in a different field or requires fetching
                // For now, we'll try to map what we can
            }
        } else {
            // Fallback to legacy/direct structure
            ({
                orderId: lalamoveOrderId,
                event,
                status,
                driver,
                location,
                estimatedDeliveryTime,
                actualDeliveryTime
            } = payload);
        }

        console.log('Parsed Webhook Data:', {
            lalamoveOrderId,
            event,
            status
        });

        // Find order by Lalamove booking ID
        let order = await prisma.order.findFirst({
            where: {
                shipping: {
                    path: ['bookingId'],
                    equals: lalamoveOrderId
                }
            },
            include: { user: true, store: true }
        });

        if (order && webhookEventId) {
             prisma.webhookEvent.update({
                 where: { id: webhookEventId },
                 data: { orderId: order.id }
             }).catch(console.error);
        }

        // If order not found, check if it's a Return
        let returnRequest = null;
        if (!order) {
            returnRequest = await prisma.return.findFirst({
                where: {
                    returnShipping: {
                        path: ['bookingId'],
                        equals: lalamoveOrderId
                    }
                },
                include: { order: { include: { user: true, store: true } } }
            });
        }

        if (!order && !returnRequest) {
            console.error('Order or Return not found for booking ID:', lalamoveOrderId);
            return NextResponse.json({
                received: true,
                message: 'Booking reference not found but webhook acknowledged'
            });
        }

        if (returnRequest) {
            // Update Webhook Log with Order ID
            if (webhookEventId) {
                prisma.webhookEvent.update({
                    where: { id: webhookEventId },
                    data: { orderId: returnRequest.orderId }
                }).catch(console.error);
            }

            // Handle Return Update
            const updatedReturnShipping = {
                ...returnRequest.returnShipping,
                status: status,
                lastEvent: event,
                updatedAt: new Date().toISOString()
            };

            // Update driver info if available
            if (driver) {
                updatedReturnShipping.driverInfo = {
                    name: driver.name || null,
                    phone: driver.phone || null,
                    plateNumber: driver.plateNumber || null,
                    photo: driver.photo || null
                };
            }

            if (location) {
                updatedReturnShipping.location = {
                    lat: location.lat || null,
                    lng: location.lng || null,
                    updatedAt: new Date().toISOString()
                };
            }

            // Map Lalamove Events to Return Status
            const newReturnStatus = normalizeStatus(status, 'lalamove', true);

            if (newReturnStatus === UNIVERSAL_STATUS.DELIVERED) {
                // Set a 2-day deadline for seller to confirm receipt
                const deadline = getNowUTC();
                deadline.setDate(deadline.getDate() + 2);

                // Only update if not already delivered
                if (returnRequest.status !== 'DELIVERED') {
                    await prisma.return.update({
                        where: { id: returnRequest.id },
                        data: {
                            deadline: deadline,
                            status: 'DELIVERED'
                        }
                    });
                    console.log(`[Lalamove Webhook] Return ${returnRequest.id} marked as DELIVERED. 2-day deadline set: ${deadline.toISOString()}`);
                }
            }

            const hasStatusChanged = newReturnStatus && newReturnStatus !== returnRequest.status;
            const hasShippingDataChanged = JSON.stringify(updatedReturnShipping) !== JSON.stringify(returnRequest.returnShipping);

            // Update Return record
            const updatedReturn = await prisma.return.update({
                where: { id: returnRequest.id },
                data: {
                    status: newReturnStatus || undefined,
                    returnShipping: updatedReturnShipping
                }
            });

            // Trigger Realtime for Return if anything changed
            if (hasStatusChanged || hasShippingDataChanged) {
                try {
                    // Trigger in parallel for speed
                    await Promise.all([
                        triggerRealtimeEvent(`store-${returnRequest.order.storeId}`, 'return-updated', {
                            returnId: returnRequest.id,
                            orderId: returnRequest.orderId,
                            status: updatedReturn.status,
                            returnShipping: updatedReturn.returnShipping
                        }),
                        triggerRealtimeEvent(`user-${returnRequest.order.userId}`, 'return-updated', {
                            returnId: returnRequest.id,
                            orderId: returnRequest.orderId,
                            status: updatedReturn.status,
                            returnShipping: updatedReturn.returnShipping
                        })
                    ]);
                } catch (reError) {
                    console.error('Failed to trigger return realtime event:', reError);
                }
            }

            console.log('Return updated successfully:', {
                returnId: returnRequest.id,
                event: event,
                status: status,
                newStatus: newReturnStatus || 'unchanged'
            });

            // Audit Log for Return
            createAuditLog(returnRequest.order.userId, 'RETURN_SHIPPING_UPDATE', null, {
                entity: 'Return',
                entityId: returnRequest.id,
                details: `Return shipping update: ${status}`,
                metadata: {
                    orderId: returnRequest.orderId,
                    lalamoveStatus: status,
                    newReturnStatus: newReturnStatus,
                    driver: driver ? 'Assigned' : 'None'
                }
            }).catch(e => console.error('[Lalamove Webhook] Audit log failed:', e));

            // Update Webhook Log to PROCESSED
            if (webhookEventId) {
                prisma.webhookEvent.update({
                    where: { id: webhookEventId },
                    data: { status: 'PROCESSED', processedAt: new Date() }
                }).catch(console.error);
            }

            return NextResponse.json({
                received: true,
                returnId: returnRequest.id,
                event: event,
                status: status,
                newStatus: newReturnStatus
            });
        }

        // --- Handle Original Order Update (Existing Logic) ---

        // Prepare updated shipping data
        const updatedShipping = {
            ...order.shipping,
            status: status,
            lastEvent: event,
            updatedAt: getNowUTC().toISOString()
        };

        // Update driver info if available
        if (driver) {
            updatedShipping.driverInfo = {
                name: driver.name || null,
                phone: driver.phone || null,
                plateNumber: driver.plateNumber || null,
                photo: driver.photo || null
            };
        }

        if (location) {
            updatedShipping.location = {
                lat: location.lat || null,
                lng: location.lng || null,
                updatedAt: getNowUTC().toISOString()
            };
        }

        // Map Lalamove Events to Order Status
        const newStatus = normalizeStatus(status, 'lalamove', false);
        console.log(`[Lalamove Webhook] Mapping status: ${status} -> ${newStatus}`);

        // Update Order record
        const hasStatusChanged = newStatus && newStatus !== order.status;
        const hasShippingDataChanged = JSON.stringify(updatedShipping) !== JSON.stringify(order.shipping);

        console.log(`[Lalamove Webhook] Changes detected - Status: ${hasStatusChanged}, Shipping: ${hasShippingDataChanged}`);

        const updateData = {
            status: newStatus || undefined,
            shipping: updatedShipping
        };

        // Add timestamps based on status
        if (newStatus === UNIVERSAL_STATUS.SHIPPING && !order.shippedAt) {
            updateData.shippedAt = getNowUTC();
        } else if (newStatus === UNIVERSAL_STATUS.DELIVERED && !order.deliveredAt) {
            updateData.deliveredAt = getNowUTC();
            const autoCompleteDate = getNowUTC();
            autoCompleteDate.setDate(autoCompleteDate.getDate() + 3); // Standard 3 days
            updateData.autoCompleteAt = autoCompleteDate;
        }

        console.log(`[Lalamove Webhook] Final Update Data:`, JSON.stringify(updateData, null, 2));

        const updatedOrder = await prisma.order.update({
            where: { id: order.id },
            data: updateData
        });

        console.log(`[Lalamove Webhook] DB Update Result:`, {
            id: updatedOrder.id,
            status: updatedOrder.status,
            deliveredAt: updatedOrder.deliveredAt
        });

        // Trigger Realtime for Order if anything changed
        if (hasStatusChanged || hasShippingDataChanged) {
            try {
                // Trigger in parallel for speed
                await Promise.all([
                    triggerRealtimeEvent(`store-${order.storeId}`, 'order-updated', {
                        orderId: order.id,
                        status: updatedOrder.status,
                        isPaid: order.isPaid,
                        paymentStatus: order.paymentStatus,
                        shipping: updatedOrder.shipping
                    }),
                    triggerRealtimeEvent(`user-${order.userId}`, 'order-updated', {
                        orderId: order.id,
                        status: updatedOrder.status,
                        isPaid: order.isPaid,
                        paymentStatus: order.paymentStatus,
                        shipping: updatedOrder.shipping
                    })
                ]);
            } catch (reError) {
                console.error('Failed to trigger order realtime event:', reError);
            }
        }

        console.log('Order updated successfully:', {
            orderId: order.id,
            event: event,
            status: status,
            newStatus: newStatus || 'unchanged'
        });

        // Send email notification if status changed
        if (newStatus) {
            try {
                await sendOrderStatusEmail(
                    order.user.email,
                    order,
                    order.user,
                    order.store,
                    newStatus
                );
                console.log(`Email notification sent for status ${newStatus}`);
            } catch (emailError) {
                console.error('Failed to send email notification:', emailError);
            }
        }

        // Return 200 OK to acknowledge receipt
        
        // Audit Log for Order
        createAuditLog(order.userId, 'SHIPPING_UPDATE', null, {
            entity: 'Order',
            entityId: order.id,
            details: `Shipping update: ${status}`,
            metadata: {
                lalamoveStatus: status,
                newOrderStatus: newStatus,
                driver: driver ? 'Assigned' : 'None'
            }
        }).catch(e => console.error('[Lalamove Webhook] Audit log failed:', e));

        // Update Webhook Log to PROCESSED
        if (webhookEventId) {
            await prisma.webhookEvent.update({
                where: { id: webhookEventId },
                data: { status: 'PROCESSED', processedAt: new Date() }
            });
        }

        return NextResponse.json({
            received: true,
            orderId: order.id,
            event: event,
            status: status,
            newStatus: newStatus
        });

    } catch (error) {
        console.error('Webhook error:', error);
        
        // Update log to FAILED
        if (webhookEventId) {
            try {
                await prisma.webhookEvent.update({
                    where: { id: webhookEventId },
                    data: { status: 'FAILED', error: error.message }
                });
            } catch (e) { console.error('Failed to update webhook log', e) }
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/webhooks/lalamove
 * Health check endpoint
 */
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        service: 'Lalamove Webhook Receiver',
        timestamp: new Date().toISOString()
    });
}
