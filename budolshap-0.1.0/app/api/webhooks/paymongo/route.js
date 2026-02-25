import { NextResponse } from 'next/server'
import { verifyWebhookSignature, createPayment } from '@/lib/paymongo'
import { prisma } from '@/lib/prisma'
import { creditPendingBalance } from '@/lib/escrow'
import { sendOrderPlacedEmail } from '@/lib/email'
import { triggerRealtimeEvent } from '@/lib/realtime'
import { updateOrderStatus } from '@/lib/services/ordersService'
import { createAuditLog } from '@/lib/audit'

/**
 * POST /api/webhooks/paymongo
 * Handle PayMongo webhook events for GCash payments
 */
export async function POST(request) {
    let webhookEventId = null;
    let eventType = 'unknown';
    let orderId = null;

    try {
        // Get raw body for signature verification
        const rawBody = await request.text()
        const signature = request.headers.get('paymongo-signature')

        console.log(`[Webhook] Received PayMongo Event. Body Length: ${rawBody.length}, Signature: ${signature ? 'Present' : 'Missing'}`);

        // Parse the event early for logging
        let event;
        try {
            event = JSON.parse(rawBody)
            eventType = event.data.attributes.type
            // Try to extract order ID from metadata if available
            const data = event.data.attributes.data
            if (data?.attributes?.metadata?.orderId) {
                orderId = data.attributes.metadata.orderId
            }
        } catch (e) {
            console.error('Failed to parse webhook body for logging', e)
        }

        // Log to Database (Pending State)
        try {
            const webhookLog = await prisma.webhookEvent.create({
                data: {
                    provider: 'paymongo',
                    eventType: eventType || 'unknown',
                    payload: event || { raw: rawBody },
                    status: 'PENDING',
                    orderId: orderId
                }
            });
            webhookEventId = webhookLog.id;
        } catch (dbError) {
            console.error('Failed to create webhook log:', dbError);
        }

        // Verify webhook signature
        if (!verifyWebhookSignature(rawBody, signature)) {
            console.error('Invalid webhook signature')
            
            // Update log if exists
            if (webhookEventId) {
                await prisma.webhookEvent.update({
                    where: { id: webhookEventId },
                    data: { status: 'FAILED', error: 'Invalid signature' }
                });
            }

            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            )
        }

        const eventData = event.data.attributes.data

        console.log('Received webhook event:', eventType)

        // Handle different event types
        switch (eventType) {
            case 'source.chargeable':
                await handleSourceChargeable(eventData)
                break

            case 'payment.paid':
                await handlePaymentPaid(eventData)
                break

            case 'payment_intent.succeeded':
                await handlePaymentIntentSucceeded(eventData)
                break

            case 'payment.failed':
                await handlePaymentFailed(eventData)
                break

            default:
                console.log('Unhandled event type:', eventType)
        }

        // Update log to PROCESSED
        if (webhookEventId) {
            await prisma.webhookEvent.update({
                where: { id: webhookEventId },
                data: { status: 'PROCESSED', processedAt: new Date() }
            });
        }

        // Always return 200 to acknowledge receipt
        return NextResponse.json({ received: true })

    } catch (error) {
        console.error('Error processing webhook:', error)
        
        // Update log to FAILED
        if (webhookEventId) {
            try {
                await prisma.webhookEvent.update({
                    where: { id: webhookEventId },
                    data: { status: 'FAILED', error: error.message }
                });
            } catch (e) { console.error('Failed to update webhook log', e) }
        }

        // Still return 200 to prevent retries for invalid data
        return NextResponse.json({ error: error.message }, { status: 200 })
    }
}

/**
 * Handle source.chargeable event
 * This is triggered when user authorizes payment in GCash
 */
async function handleSourceChargeable(data) {
    try {
        const sourceId = data.id
        const amount = data.attributes.amount

        console.log('Source is chargeable:', sourceId)

        // Find order with this source ID
        const order = await prisma.order.findFirst({
            where: { paymentSourceId: sourceId }
        })

        if (!order) {
            console.error('Order not found for source:', sourceId)
            return
        }

        // Idempotency check: If order already has paymentId (processing or paid), skip
        if (order.paymentId && order.paymentId.startsWith('pay_')) {
            console.log('Order already processed (has payment ID):', order.id)
            return
        }

        // Create payment to capture the funds
        const payment = await createPayment(sourceId, amount)

        console.log('Payment created:', payment.data.id)

        // Audit Log
        createAuditLog(order.userId, 'PAYMENT_PROCESSING', null, {
            entity: 'Order',
            entityId: order.id,
            details: `Source chargeable. Created payment ${payment.data.id}`,
            metadata: { 
                sourceId, 
                amount,
                provider: 'PayMongo'
            }
        }).catch(e => console.error('[Webhook] Audit log failed:', e));

        // Update order with payment ID
        await prisma.order.update({
            where: { id: order.id },
            data: {
                paymentId: payment.data.id,
                paymentStatus: 'processing'
            }
        })

    } catch (error) {
        console.error('Error handling source.chargeable:', error)
        throw error
    }
}

/**
 * Helper to process successful order actions (Email, Cart, Realtime)
 */
async function processSuccessfulOrder(order) {
    // 1. Send Email
    try {
        await sendOrderPlacedEmail(
            order.user.email,
            order,
            order.user,
            order.store
        )
    } catch (e) {
        console.error('Failed to send success email in webhook:', e)
    }

    // 2. Clear Cart (Robust Implementation)
        try {
            // Need to fetch order items first if not present
            const orderItems = await prisma.orderItem.findMany({
                where: { orderId: order.id }
            })

            const userCart = await prisma.cart.findUnique({ where: { userId: order.userId } })
            
            if (userCart && orderItems.length > 0) {
                console.log(`[Webhook] Clearing cart for user ${order.userId} based on order ${order.id}`);
                
                // Construct robust delete conditions
                const cartCleanupConditions = orderItems.map(item => {
                    // If variationId is null or empty, match both null and empty string in CartItem
                    // This handles potential inconsistencies between empty string and null in DB
                    if (!item.variationId) {
                        return {
                            productId: item.productId,
                            OR: [
                                { variationId: null },
                                { variationId: '' }
                            ]
                        };
                    }
                    // Otherwise match exactly
                    return {
                        productId: item.productId,
                        variationId: item.variationId
                    };
                });

                // Execute single deleteMany with OR condition for efficiency and robustness
                const deleteResult = await prisma.cartItem.deleteMany({
                    where: {
                        cartId: userCart.id,
                        OR: cartCleanupConditions
                    }
                });
                
                console.log(`[Webhook] Cleared ${deleteResult.count} items from cart for user:`, order.userId)
            }
        } catch (e) {
            console.error('Failed to clear cart in webhook:', e)
        }

    // 3. Trigger Realtime Events in parallel
    try {
        await Promise.all([
            // Notify Store of new order
            triggerRealtimeEvent(`store-${order.storeId}`, 'order-created', {
                orderId: order.id,
                total: order.total,
                status: order.status,
                items: order.orderItems || [],
                createdAt: order.createdAt
            }),
            // Notify Store of status update
            triggerRealtimeEvent(`store-${order.storeId}`, 'order-updated', {
                orderId: order.id,
                status: order.status
            }),
            // Notify User (Buyer)
            triggerRealtimeEvent(`user-${order.userId}`, 'order-updated', {
                orderId: order.id,
                status: order.status
            })
        ]);
    } catch (e) {
        console.error('Failed to trigger realtime event in webhook:', e)
    }

    // 4. Audit Log
    createAuditLog(order.userId, 'PAYMENT_SUCCESS', null, {
        entity: 'Order',
        entityId: order.id,
        details: `Payment successful for order ${order.id}. Amount: ${order.total}`,
        metadata: { 
            paymentId: order.paymentId, 
            method: order.paymentMethod,
            provider: 'PayMongo'
        }
    }).catch(e => console.error('[Webhook] Audit log failed:', e));
}


/**
 * Handle payment.paid event
 * This confirms the payment was successful
 */
async function handlePaymentPaid(data) {
    try {
        const paymentId = data.id
        const sourceId = data.attributes.source?.id
        const paymentIntentId = data.attributes.payment_intent_id // New: Extract Intent ID
        const amount = data.attributes.amount / 100 // PayMongo amounts are in cents
        const metadata = data.attributes.metadata || {}
        const orderId = metadata.orderId

        console.log('Payment successful:', paymentId, 'Amount:', amount, 'Intent:', paymentIntentId)

        let whereClause = {
            OR: [
                { paymentId: paymentId }, // Matches if we stored Payment ID
                { paymentId: paymentIntentId }, // Matches if we stored Intent ID (New Flow)
                { paymentSourceId: sourceId } // Matches legacy Source ID
            ]
        };

        // If metadata has orderId, prefer searching by ID as it's definitive
        if (orderId) {
            whereClause = { id: orderId };
        }

        // Find order with this payment ID or source ID or payment Intent ID
        const order = await prisma.order.findFirst({
            where: whereClause,
            include: {
                store: true,
                user: true // Need user for email
            }
        })

        if (!order) {
            console.error('Order not found for payment:', paymentId)
            return
        }

        // Idempotency check
        if (order.isPaid) {
            console.log('Order already paid, skipping:', order.id)
            return
        }

        // Update order to paid and change status to PAID using the service
        // (updateOrderStatus handles status, isPaid, paidAt, paymentStatus, and realtime triggers)
        const updatedOrder = await updateOrderStatus(order.id, {
            isPaid: true,
            status: 'PROCESSING'
        })

        // Also ensure payment reference is stored if not already handled
        if (paymentId || paymentIntentId) {
            await prisma.order.update({
                where: { id: order.id },
                data: { paymentId: paymentId || paymentIntentId }
            });
        }

        // Credit seller's pending balance using escrow service
        // This will hold funds in escrow until order is completed
        await creditPendingBalance({
            orderId: updatedOrder.id,
            amount: updatedOrder.total, // Use order total (includes shipping)
            gateway: 'PAYMONGO'
        })

        console.log('✅ Order marked as paid and funds held in escrow:', updatedOrder.id)

        // Process Post-Success Actions (Email, Cart)
        await processSuccessfulOrder(updatedOrder)

    } catch (error) {
        console.error('Error handling payment.paid:', error)
        throw error
    }
}

/**
 * Handle payment_intent.succeeded event
 * This is the primary event for Card/Maya/GrabPay Intents flow
 */
async function handlePaymentIntentSucceeded(data) {
    try {
        const paymentIntentId = data.id
        const amount = data.attributes.amount / 100
        const metadata = data.attributes.metadata || {}
        const orderId = metadata.orderId
        const checkoutId = metadata.checkoutId // New: Extract Checkout ID
        
        // Parse orderIds from metadata
        let orderIds = [];
        try {
            if (metadata.orderIds) {
                orderIds = typeof metadata.orderIds === 'string' 
                    ? JSON.parse(metadata.orderIds) 
                    : metadata.orderIds;
            }
        } catch (e) {
            console.error('Failed to parse orderIds from metadata:', e);
        }

        console.log('Payment Intent succeeded:', paymentIntentId)

        // Determine target orders
        let targetOrderIds = [];

        // 1. If Checkout ID exists, use it to find all linked orders
        if (checkoutId) {
             console.log(`[PayMongo Webhook] Processing via Checkout ID: ${checkoutId}`);
             try {
                 // Update Checkout Status
                 await prisma.checkout.update({
                     where: { id: checkoutId },
                     data: { 
                         status: 'PAID',
                         paymentId: paymentIntentId,
                         paymentProvider: 'PAYMONGO'
                     }
                 });
                 
                 // Find all orders linked to this checkout
                 const checkoutOrders = await prisma.order.findMany({
                     where: { checkoutId: checkoutId },
                     select: { id: true }
                 });
                 
                 if (checkoutOrders.length > 0) {
                     targetOrderIds = checkoutOrders.map(o => o.id);
                     console.log(`[PayMongo Webhook] Found ${targetOrderIds.length} orders linked to checkout ${checkoutId}`);
                 }
             } catch (checkoutError) {
                 console.error('[PayMongo Webhook] Error processing checkout:', checkoutError);
             }
        }

        // 2. Fallback to metadata orderIds if no checkout orders found
        if (targetOrderIds.length === 0) {
            if (orderIds && Array.isArray(orderIds) && orderIds.length > 0) {
                targetOrderIds = orderIds;
            } else if (orderId) {
                targetOrderIds = [orderId];
            }
        }

        if (targetOrderIds.length > 0) {
             console.log(`[PayMongo Webhook] Updating ${targetOrderIds.length} orders: ${targetOrderIds.join(', ')}`);
             for (const id of targetOrderIds) {
                 // Pass paymentIntentId so it can be saved to the order if missing
                 await processSingleOrderPayment(id, { paymentIntentId });
             }
        } else {
             await processPaymentByReference({ paymentIntentId });
        }
    } catch (error) {
        console.error('Error handling payment_intent.succeeded:', error)
        throw error
    }
}

/**
 * Handle payment.failed event
 * This is triggered when payment fails
 */
async function handlePaymentFailed(data) {
    try {
        const paymentId = data.id
        console.log('Payment failed:', paymentId)
        // Note: For failed payments, we often can't do much if we can't find the order 
        // effectively without metadata, but loopup strategies apply similar to paid.
    } catch (e) {
        console.error(e)
    }
}

async function processPaymentByReference({ paymentId, sourceId, paymentIntentId }) {
    let whereClause = {
        OR: [
            { paymentId: paymentId }, // Matches if we stored Payment ID
            { paymentId: paymentIntentId }, // Matches if we stored Intent ID (New Flow)
            { paymentSourceId: sourceId } // Matches legacy Source ID
        ]
    };

    // Find ALL orders matching the payment reference
    const orders = await prisma.order.findMany({
        where: whereClause,
        include: { store: true, user: true }
    })

    if (!orders || orders.length === 0) {
        console.error('Orders not found for payment reference:', paymentId || paymentIntentId)
        return
    }

    console.log(`[PayMongo Webhook] Found ${orders.length} orders by reference. Updating...`);

    for (const order of orders) {
        await completeOrderPayment(order, { paymentId, paymentIntentId });
    }
}

async function processSingleOrderPayment(orderId, { paymentIntentId }) {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { store: true, user: true }
        });

        if (!order) {
            console.error('[PayMongo Webhook] Order not found:', orderId);
            return;
        }

        if (order.isPaid) {
            console.log('[PayMongo Webhook] Order already paid:', orderId);
            return;
        }

        // Update order status
        const updatedOrder = await updateOrderStatus(order.id, {
            isPaid: true,
            status: 'PROCESSING',
            paymentId: paymentIntentId, // Ensure paymentId is set
            paymentStatus: 'paid'
        });

        // Credit Escrow
        await creditPendingBalance({
            orderId: updatedOrder.id,
            amount: updatedOrder.total,
            gateway: 'PAYMONGO'
        });

        // Process Post-Success
        await processSuccessfulOrder(updatedOrder);
        
        console.log('[PayMongo Webhook] Successfully processed order:', orderId);

    } catch (error) {
        console.error('[PayMongo Webhook] Error processing single order:', orderId, error);
    }
}

async function completeOrderPayment(order, { paymentId, paymentIntentId }) {
    try {
        if (order.isPaid) {
            console.log('[PayMongo Webhook] Order already paid:', order.id);
            return;
        }

        // Update order status
        const updatedOrder = await updateOrderStatus(order.id, {
            isPaid: true,
            status: 'PROCESSING',
            paymentId: paymentId || paymentIntentId,
            paymentStatus: 'paid'
        });

        // Credit Escrow
        await creditPendingBalance({
            orderId: updatedOrder.id,
            amount: updatedOrder.total,
            gateway: 'PAYMONGO'
        });

        // Process Post-Success
        await processSuccessfulOrder(updatedOrder);
        
        console.log('[PayMongo Webhook] Successfully processed order:', order.id);

    } catch (error) {
        console.error('[PayMongo Webhook] Error processing order:', order.id, error);
    }
}
