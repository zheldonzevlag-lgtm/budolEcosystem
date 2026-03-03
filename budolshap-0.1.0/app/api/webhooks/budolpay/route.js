import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { creditPendingBalance } from '@/lib/escrow';
import { sendOrderPlacedEmail } from '@/lib/email';
import { triggerRealtimeEvent } from '@/lib/realtime';
import { updateOrderStatus } from '@/lib/services/ordersService';
import { createAuditLog } from '@/lib/audit';

/**
 * POST /api/webhooks/budolpay
 * Handle BudolPay Gateway webhook events
 */
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
        },
    });
}

export async function POST(request) {
    let webhookEventId = null;
    let event = 'unknown';
    let data = {};

    try {
        const body = await request.json();
        event = body.event;
        data = body.data;

        console.log('[BudolPay Webhook] Received event:', event);

        // 1. Log to Database (Pending)
        try {
            const webhookLog = await prisma.webhookEvent.create({
                data: {
                    provider: 'budolpay',
                    eventType: event || 'unknown',
                    payload: body,
                    status: 'PENDING',
                    orderId: data?.metadata?.orderId
                }
            });
            webhookEventId = webhookLog.id;
        } catch (dbError) {
            console.error('Failed to create webhook log:', dbError);
        }

        // Security: In a production environment, we would verify a signature here.
        // For Phase 2, we'll process the event based on the 'payment.success' type.
        
        if (event === 'payment.success' || event === 'payment_intent.succeeded') {
            await handlePaymentSuccess(data);
        } else if (event === 'payment.failed' || event === 'payment_intent.payment_failed') {
            await handlePaymentFailure(data);
        } else {
            console.log('[BudolPay Webhook] Unhandled event type:', event);
        }

        // 2. Update log to PROCESSED
        if (webhookEventId) {
            await prisma.webhookEvent.update({
                where: { id: webhookEventId },
                data: { status: 'PROCESSED', processedAt: new Date() }
            });
        }

        return NextResponse.json(
            { received: true }, 
            { 
                status: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
                }
            }
        );

    } catch (error) {
        console.error('[BudolPay Webhook Error]', error);

        // 3. Update log to FAILED
        if (webhookEventId) {
            try {
                await prisma.webhookEvent.update({
                    where: { id: webhookEventId },
                    data: { status: 'FAILED', error: error.message }
                });
            } catch (e) { console.error('Failed to update webhook log', e) }
        }

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * Handle failed payment event
 */
async function handlePaymentFailure(data) {
    const paymentIntentId = data.id || data.paymentIntentId;
    const metadata = data.metadata || {};
    const orderId = metadata.orderId;
    const orderIds = metadata.orderIds;

    console.log(`[BudolPay Webhook] Processing failure. Intent: ${paymentIntentId}`);

    let targetOrderIds = [];
    if (orderIds && Array.isArray(orderIds) && orderIds.length > 0) {
        targetOrderIds = orderIds;
    } else if (orderId) {
        targetOrderIds = [orderId];
    }

    if (targetOrderIds.length === 0 && paymentIntentId) {
        const orders = await prisma.order.findMany({
            where: { paymentId: paymentIntentId },
            select: { id: true }
        });
        targetOrderIds = orders.map(o => o.id);
    }

    for (const id of targetOrderIds) {
        try {
            const order = await prisma.order.findUnique({
                where: { id },
                include: { orderItems: true }
            });

            if (order) {
                console.log(`[BudolPay Webhook] Clearing cart for failed payment. Order: ${order.id}, User: ${order.userId}`);
                
                // Clear items from database cart
                const userCart = await prisma.cart.findUnique({ where: { userId: order.userId } });
                if (userCart && order.orderItems.length > 0) {
                    const cartCleanupConditions = order.orderItems.map(item => {
                        if (!item.variationId) {
                            return {
                                productId: item.productId,
                                OR: [{ variationId: null }, { variationId: '' }]
                            };
                        }
                        return { productId: item.productId, variationId: item.variationId };
                    });

                    await prisma.cartItem.deleteMany({
                        where: {
                            cartId: userCart.id,
                            OR: cartCleanupConditions
                        }
                    });

                    // Notify UI to refresh cart
                    await triggerRealtimeEvent(`user-${order.userId}`, 'cart-updated', {
                        userId: order.userId,
                        reason: 'payment_failed'
                    });
                }

                // Update payment status
                if (!order.isPaid) {
                    await prisma.order.update({
                        where: { id: order.id },
                        data: { paymentStatus: 'failed' }
                    });
                }
            }
        } catch (e) {
            console.error(`[BudolPay Webhook] Error processing failure for order ${id}:`, e);
        }
    }
}

async function handlePaymentSuccess(data) {
    const paymentIntentId = data.id || data.paymentIntentId;
    const metadata = data.metadata || {};
    const orderId = metadata.orderId;
    const orderIds = metadata.orderIds; // Support multi-store orders
    const checkoutId = metadata.checkoutId; // Support master checkout

    console.log(`[BudolPay Webhook] Processing success. Intent: ${paymentIntentId}`);

    // Determine target orders
    let targetOrderIds = [];

    // 1. If Checkout ID exists, use it
    if (checkoutId) {
        console.log(`[BudolPay Webhook] Processing via Checkout ID: ${checkoutId}`);
        try {
            // Update Checkout Status
            await prisma.checkout.update({
                where: { id: checkoutId },
                data: { 
                    status: 'PAID',
                    paymentId: paymentIntentId,
                    paymentProvider: 'BUDOL_PAY'
                }
            });
            
            // Find all orders linked to this checkout
            const checkoutOrders = await prisma.order.findMany({
                where: { checkoutId: checkoutId },
                select: { id: true }
            });
            
            if (checkoutOrders.length > 0) {
                targetOrderIds = checkoutOrders.map(o => o.id);
                console.log(`[BudolPay Webhook] Found ${targetOrderIds.length} orders linked to checkout ${checkoutId}`);
            }
        } catch (checkoutError) {
            console.error('[BudolPay Webhook] Error processing checkout:', checkoutError);
        }
    }

    // 2. Fallback to metadata orderIds
    if (targetOrderIds.length === 0) {
        if (orderIds && Array.isArray(orderIds) && orderIds.length > 0) {
            targetOrderIds = orderIds;
        } else if (orderId) {
            targetOrderIds = [orderId];
        }
    }

    if (targetOrderIds.length === 0) {
        // Fallback: search by paymentIntentId
        if (paymentIntentId) {
            console.log(`[BudolPay Webhook] No orderIds in metadata, searching by Payment Intent: ${paymentIntentId}`);
            const orders = await prisma.order.findMany({
                where: { paymentId: paymentIntentId },
                select: { id: true }
            });
            
            if (orders.length > 0) {
                targetOrderIds = orders.map(o => o.id);
            }
        }
    }

    if (targetOrderIds.length === 0) {
        console.error('[BudolPay Webhook] No orderId found in metadata or by reference');
        return;
    }

    console.log(`[BudolPay Webhook] Updating ${targetOrderIds.length} orders: ${targetOrderIds.join(', ')}`);

    // Process each order sequentially to avoid race conditions
    for (const id of targetOrderIds) {
        try {
            await processSingleOrder(id, paymentIntentId);
        } catch (e) {
            console.error(`[BudolPay Webhook] Error processing order ${id}:`, e);
        }
    }
}

async function processSingleOrder(orderId, paymentIntentId) {
    console.log(`[BudolPay Webhook] Processing Order: ${orderId}`);

    // Find the order
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            user: true,
            store: true,
            orderItems: true
        }
    });

    if (!order) {
        console.error(`[BudolPay Webhook] Order ${orderId} not found`);
        return;
    }

    // Idempotency check
    if (order.isPaid) {
        console.log(`[BudolPay Webhook] Order ${orderId} already marked as paid`);
        return;
    }

    // Update order status using the service
    // (updateOrderStatus handles status, isPaid, paidAt, paymentStatus, and realtime triggers)
    const updatedOrder = await updateOrderStatus(order.id, {
        isPaid: true,
        status: 'PROCESSING',
        paymentStatus: 'paid'
    });

    // Ensure payment ID is stored
    if (paymentIntentId && updatedOrder.paymentId !== paymentIntentId) {
        await prisma.order.update({
            where: { id: order.id },
            data: { paymentId: paymentIntentId }
        });
    }

    // Forensic Audit Log
    createAuditLog(order.userId, 'PAYMENT_SUCCESS', null, {
        entity: 'Order',
        entityId: order.id,
        details: `Payment successful via BudolPay for order ${order.id}. Amount: ${updatedOrder.total}`,
        metadata: { 
            paymentId: paymentIntentId, 
            method: 'BUDOLPAY', 
            provider: 'BudolPay',
            amount: updatedOrder.total 
        }
    }).catch(e => console.error('[BudolPay Webhook] Audit log failed:', e));

    // Credit escrow (Phase 2 requirement)
    try {
        console.log(`[BudolPay Webhook] Crediting escrow for Order ${orderId}...`);
        const result = await creditPendingBalance({
            orderId: orderId,
            amount: updatedOrder.total,
            gateway: 'BUDOLPAY'
        });
        console.log(`[BudolPay Webhook] Escrow credited successfully for Order ${orderId}. Transaction ID: ${result?.id}`);
    } catch (escrowError) {
        console.error('[BudolPay Webhook] Escrow credit failed:', escrowError);
    }

    // Post-payment actions
    await runPostPaymentActions(updatedOrder);
}

/**
 * Common post-payment workflows
 */
async function runPostPaymentActions(order) {
    // 1. Send Confirmation Email
    try {
        await sendOrderPlacedEmail(order.user.email, order, order.user, order.store);
    } catch (e) {
        console.error('[BudolPay Webhook] Email failed:', e);
    }

    // 2. Clear Cart Items
    // NOTE: This is handled by updateOrderStatus() in ordersService.js during status transition to PAID.
    // We do not need redundant logic here.

    // 3. Notify Store & User via Realtime in parallel
    try {
        await Promise.all([
            // Notify Store of new order
            triggerRealtimeEvent(`store-${order.storeId}`, 'order-created', {
                orderId: order.id,
                total: order.total,
                status: order.status
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
        console.error('[BudolPay Webhook] Realtime notification failed:', e);
    }

    // 4. Audit Log
    createAuditLog(order.userId, 'PAYMENT_SUCCESS', null, {
        entity: 'Order',
        entityId: order.id,
        details: `Payment successful via BudolPay for order ${order.id}. Amount: ${order.total}`,
        metadata: { 
            paymentId: order.paymentId, 
            method: 'BudolPay',
            provider: 'BudolPay'
        }
    }).catch(e => console.error('[Webhook] Audit log failed:', e));
}
