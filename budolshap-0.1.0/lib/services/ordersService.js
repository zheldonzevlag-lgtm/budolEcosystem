import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { triggerRealtimeEvent } from '@/lib/realtime';
import { creditPendingBalance } from '@/lib/escrow';
import { createAuditLog } from '@/lib/audit';

/**
 * Get orders with filters and pagination
 * @param {object} filters - Filter parameters
 * @param {string} filters.userId - Filter by user ID
 * @param {string} filters.storeId - Filter by store ID
 * @param {string} filters.status - Filter by order status
 * @param {boolean} filters.isPaid - Filter by payment status
 * @param {string} filters.paymentStatus - Filter by payment status
 * @param {string} filters.paymentMethod - Filter by payment method
 * @param {string} filters.excludePaymentMethod - Exclude payment method
 * @param {boolean} filters.excludeAbandonedPayments - Exclude abandoned/cancelled payments (default: true)
 * @param {string} filters.search - Search query (order ID, customer name, or product name)
 * @param {number} filters.page - Page number (default: 1)
 * @param {number} filters.limit - Items per page (default: 20, max: 50)
 * @returns {Promise<object>} - { orders, pagination }
 */
export async function getOrders(filters = {}) {
    const {
        userId,
        storeId,
        status,
        isPaid,
        paymentStatus,
        paymentMethod,
        paymentId,
        excludePaymentMethod,
        excludeAbandonedPayments = true,
        search,
        page = 1,
        limit = 20
    } = filters;

    const where = { AND: [] };

    if (userId) where.AND.push({ userId });
    if (storeId) where.AND.push({ storeId });
    if (paymentId) where.AND.push({ paymentId });

    if (search) {
        where.AND.push({
            OR: [
                { id: { contains: search, mode: 'insensitive' } },
                { user: { name: { contains: search, mode: 'insensitive' } } },
                {
                    orderItems: {
                        some: {
                            product: {
                                name: { contains: search, mode: 'insensitive' }
                            }
                        }
                    }
                }
            ]
        });
    }

    if (status) {
        if (status.includes(',')) {
            where.AND.push({ status: { in: status.split(',') } });
        } else {
            where.AND.push({ status });
        }
    }

    if (isPaid !== null && isPaid !== undefined) {
        where.AND.push({ isPaid: isPaid === true || isPaid === 'true' });
    }

    if (paymentStatus) where.AND.push({ paymentStatus });
    if (paymentMethod) where.AND.push({ paymentMethod });
    if (excludePaymentMethod) where.AND.push({ paymentMethod: { not: excludePaymentMethod } });

    // Exclude abandoned/cancelled payments (default: true)
    if (excludeAbandonedPayments === true || excludeAbandonedPayments === 'true') {
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

        console.log(`[Monitoring] Applying Abandoned Payment Filter. Threshold: ${thirtyMinutesAgo.toISOString()}`);

        where.AND.push({
            OR: [
                // 1. Include orders that are not in terminal abandoned statuses
                // Note: 'failed' and 'expired' are terminal failures and should be hidden immediately
                {
                    AND: [
                        { paymentStatus: { notIn: ['cancelled', 'failed', 'expired', 'awaiting_payment'] } }
                    ]
                },
                // 2. Include COD orders even if awaiting payment
                {
                    AND: [
                        { paymentMethod: 'COD' },
                        { paymentStatus: 'awaiting_payment' }
                    ]
                },
                // 3. Include RECENT non-COD awaiting_payment orders (less than 30 minutes)
                // This allows users to finish their checkout, but hides them if they abandon it.
                {
                    AND: [
                        { paymentStatus: 'awaiting_payment' },
                        { paymentMethod: { not: 'COD' } },
                        { createdAt: { gte: thirtyMinutesAgo } }
                    ]
                }
            ]
        });
    }

    // New Cancelled Logic: Matches Store Admin logic
    if (filters.isCancelledTab) {
        where.AND.push({
            OR: [
                { status: 'CANCELLED' },
                { paymentStatus: { in: ['cancelled', 'failed', 'expired'] } },
                {
                    AND: [
                        {
                            shipping: {
                                path: ['failureReason'],
                                not: Prisma.DbNull
                            }
                        },
                        {
                            shipping: {
                                path: ['failureReason'],
                                not: Prisma.JsonNull
                            }
                        }
                    ]
                }
            ]
        });
        where.AND.push({ status: { notIn: ['DELIVERED', 'COMPLETED'] } });
    }

    // Clean up empty AND
    if (where.AND.length === 0) delete where.AND;

    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 50);
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await prisma.$transaction([
        prisma.order.findMany({
            where,
            skip,
            take: limitNum,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                store: {
                    select: {
                        id: true,
                        name: true,
                        logo: true
                    }
                },
                address: {
                    select: {
                        id: true,
                        name: true,
                        street: true,
                        city: true,
                        state: true,
                        zip: true,
                        country: true,
                        phone: true
                    }
                },
                orderItems: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                images: true,
                                variation_matrix: true,
                                tier_variations: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        }),
        prisma.order.count({ where })
    ]);

    return {
        orders: orders.map(order => ({
            ...order,
            items: order.orderItems // Map to frontend expected 'items' key
        })),
        pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum)
        }
    };
}

/**
 * Get single order by ID
 * @param {string} orderId - Order ID
 * @returns {Promise<object|null>} - Order object or null
 */
export async function getOrderById(orderId) {
    if (!orderId) return null;

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true
                }
            },
            store: {
                select: {
                    id: true,
                    name: true,
                    logo: true
                }
            },
            address: true,
            orderItems: {
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            price: true,
                            images: true,
                            variation_matrix: true,
                            tier_variations: true
                        }
                    }
                }
            },
            paymentProof: true,
            returns: true
        }
    });

    if (!order) return null;

    return {
        ...order,
        items: order.orderItems // Map to frontend expected 'items' key
    };
}

/**
 * Create new order(s)
 * @param {object} orderData - Order data
 * @returns {Promise<Array>} - Array of created orders
 */
export async function createOrder(orderData) {
    const { userId, addressId, orderItems, paymentMethod, couponCode, shippingCost: providedShippingCost, shipping } = orderData;
    const results = [];

    // 1. Validate input
    if (!userId || !addressId || !orderItems || !orderItems.length) {
        throw new Error('Missing required order data');
    }

    // 2. Verify address belongs to user
    const address = await prisma.address.findFirst({
        where: { id: addressId, userId }
    });
    if (!address) throw new Error('Invalid address');

    // 3. Fetch product details
    const productIds = orderItems.map(item => item.productId);
    const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: { store: true }
    });

    // 4. Validate products exist and are in stock
    const itemsByStore = {};
    for (const item of orderItems) {
        const product = products.find(p => p.id === item.productId);
        if (!product) throw new Error(`Product ${item.productId} not found`);
        if (!product.inStock) {
            throw new Error(`Product ${product.name} is currently out of stock`);
        }

        // Get variation-specific price if variationId is provided
        let itemPrice = product.price;
        if (item.variationId && product.variation_matrix) {
            const selectedVariation = product.variation_matrix.find(v => v.sku === item.variationId);
            if (selectedVariation) {
                itemPrice = selectedVariation.price;
                // Also check variation stock
                if (selectedVariation.stock === 0) {
                    throw new Error(`Product variation is currently out of stock`);
                }
            }
        }

        if (!itemsByStore[product.storeId]) {
            itemsByStore[product.storeId] = {
                storeId: product.storeId,
                items: [],
                subtotal: 0
            };
        }

        const itemTotal = itemPrice * item.quantity;
        itemsByStore[product.storeId].items.push({
            productId: item.productId,
            variationId: item.variationId || null, // Save variationId
            quantity: item.quantity,
            price: itemPrice, // Use variation price
            total: itemTotal
        });
        itemsByStore[product.storeId].subtotal += itemTotal;
    }

    // 5. Create orders in transaction
    // --- PHASE 4 OPTIMIZATION: NON-INTERACTIVE BATCH TRANSACTION ---
    // This approach is much faster and avoids the 5s limit of Prisma Accelerate/Vercel
    
    // 1. Fetch current product data (Snapshot) outside transaction
    const productSnapshot = await prisma.product.findMany({
        where: { id: { in: productIds } }
    });

    // 2. Preparation & Validation
    const transactions = [];
    let grandTotal = 0;

    // Validate Stock & Build Update Transactions
    for (const item of orderItems) {
        const product = productSnapshot.find(p => p.id === item.productId);
        if (!product) throw new Error(`Product not found: ${item.productId}`);
        
        const hasVariations = product.variation_matrix && 
                              Array.isArray(product.variation_matrix) && 
                              product.variation_matrix.length > 0;

        if (hasVariations) {
            const matrix = JSON.parse(JSON.stringify(product.variation_matrix));
            const variantIndex = matrix.findIndex(v => v.sku === item.variationId);
            
            if (variantIndex === -1) throw new Error(`Variation not found: ${item.variationId}`);
            if (matrix[variantIndex].stock < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);
            
            matrix[variantIndex].stock -= item.quantity;
            const totalStock = matrix.reduce((acc, v) => acc + (v.stock || 0), 0);
            
            transactions.push(prisma.product.update({
                where: { id: item.productId },
                data: { 
                    variation_matrix: matrix,
                    stock: totalStock,
                    inStock: totalStock > 0
                }
            }));
        } else {
            if ((product.stock || 0) < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);
            
            transactions.push(prisma.product.update({
                where: { id: item.productId },
                data: { 
                    stock: { decrement: item.quantity },
                    inStock: ((product.stock || 0) - item.quantity) > 0
                }
            }));
        }
    }

    // 3. Create Checkout first (to get ID)
    for (const storeId in itemsByStore) {
        const storeData = itemsByStore[storeId];
        const shippingCost = providedShippingCost !== undefined ? providedShippingCost : 50;
        grandTotal += (storeData.subtotal + shippingCost);
    }

    const checkout = await prisma.checkout.create({
        data: {
            userId,
            total: grandTotal,
            status: 'PENDING'
        }
    });

    // 4. Build Order Creation Transactions
    for (const storeId in itemsByStore) {
        const storeData = itemsByStore[storeId];
        const shippingCost = providedShippingCost !== undefined ? providedShippingCost : 50;
        const total = storeData.subtotal + shippingCost;

        transactions.push(prisma.order.create({
            data: {
                userId,
                addressId,
                storeId,
                status: 'ORDER_PLACED',
                paymentMethod,
                shippingCost,
                shipping: shipping || { provider: 'standard' },
                total,
                isPaid: false,
                paymentStatus: 'pending',
                checkoutId: checkout.id,
                orderItems: {
                    create: storeData.items.map(item => ({
                        productId: item.productId,
                        variationId: item.variationId,
                        quantity: item.quantity,
                        price: item.price
                    }))
                }
            },
            include: {
                orderItems: { include: { product: true } },
                store: true,
                user: true
            }
        }));
    }

    // 5. Batch Cart Cleanup
    const isAsyncPayment = ['GCASH', 'MAYA', 'PAYMAYA', 'GRAB_PAY', 'QRPH', 'CARD', 'BUDOL_PAY', 'budolPay'].includes(paymentMethod.toUpperCase());
    if (!isAsyncPayment) {
        const userCart = await prisma.cart.findUnique({ where: { userId }, select: { id: true } });
        if (userCart) {
            const allCartConditions = [];
            for (const storeId in itemsByStore) {
                itemsByStore[storeId].items.forEach(item => {
                    const product = productSnapshot.find(p => p.id === item.productId);
                    const hasVariations = product?.variation_matrix?.length > 0;
                    const targetVariationId = hasVariations ? (item.variationId || null) : null;

                    if (!targetVariationId) {
                        allCartConditions.push({ productId: item.productId, OR: [{ variationId: null }, { variationId: '' }] });
                    } else {
                        allCartConditions.push({ productId: item.productId, variationId: targetVariationId });
                    }
                });
            }

            if (allCartConditions.length > 0) {
                transactions.push(prisma.cartItem.deleteMany({
                    where: { cartId: userCart.id, OR: allCartConditions }
                }));
            }
        }
    }

    // 6. Execute All in a single non-interactive transaction
    console.log(`[OrderService] Executing ${transactions.length} batched operations...`);
    const batchResults = await prisma.$transaction(transactions);
    
    // Extract orders from results (they were added after product updates)
    const orderResults = batchResults.filter(r => r && r.id && r.orderItems);

    return { checkoutId: checkout.id, orders: orderResults };

    // 7. Trigger real-time events
    try {
        for (const order of createdOrders) {
            await triggerRealtimeEvent(`store-${order.storeId}`, 'new-order', {
                orderId: order.id,
                total: order.total,
                customerName: order.user?.name || 'A buyer'
            });
        }
    } catch (reError) {
        console.error('[OrdersService] Failed to trigger realtime events:', reError);
    }

    // 6. Audit Logging
    for (const order of createdOrders) {
        createAuditLog(order.userId, 'ORDER_CREATED', null, {
            entity: 'Order',
            entityId: order.id,
            details: `Order created for store ${order.storeId}. Total: ${order.total}`,
            metadata: { 
                storeId: order.storeId,
                // itemsByStore is keyed by storeId, so this should work
                itemCount: itemsByStore[order.storeId]?.items?.length || 0
            }
        }).catch(e => console.error('[OrdersService] Audit log failed:', e));
    }

    // Return object containing both orders and the master checkout ID
    return { orders: createdOrders, checkoutId };
}

/**
 * Cancel an order and optionally restore cart items
 * @param {string} orderId - Order ID
 * @param {boolean} restoreCart - Whether to restore items to cart
 * @returns {Promise<object>} - Updated order
 */
export async function cancelOrder(orderId, restoreCart = true) {
    return await prisma.$transaction(async (tx) => {
        // 1. Get the order with items
        const order = await tx.order.findUnique({
            where: { id: orderId },
            include: { orderItems: true }
        });

        if (!order) throw new Error('Order not found');
        if (order.status === 'COMPLETED' || order.isPaid) {
            throw new Error('Cannot cancel a completed or paid order');
        }

        // 2. Update order status
        const updatedOrder = await tx.order.update({
            where: { id: orderId },
            data: {
                status: 'CANCELLED',
                paymentStatus: 'cancelled'
            }
        });

        // 3. Restore cart items if requested
        // ONLY restore if the payment method is one that clears the cart immediately (like COD)
        // For async payments, we don't clear the cart until payment is successful, 
        // so if cancelled before payment, the items are still in the cart.
        const isAsyncPayment = ['GCASH', 'MAYA', 'GRAB_PAY', 'QRPH', 'BUDOL_PAY', 'budolPay'].includes(order.paymentMethod.toUpperCase());
        
        if (restoreCart && !isAsyncPayment) {
            const cart = await tx.cart.findFirst({
                where: { userId: order.userId }
            });

            if (cart) {
                for (const item of order.orderItems) {
                    // Check if item already exists in cart (matching product AND variation)
                    const existingItem = await tx.cartItem.findFirst({
                        where: {
                            cartId: cart.id,
                            productId: item.productId,
                            variationId: item.variationId // Ensure variation matches
                        }
                    });

                    if (existingItem) {
                        await tx.cartItem.update({
                            where: { id: existingItem.id },
                            data: { quantity: existingItem.quantity + item.quantity }
                        });
                    } else {
                        await tx.cartItem.create({
                            data: {
                                cartId: cart.id,
                                productId: item.productId,
                                variationId: item.variationId, // Include variationId
                                quantity: item.quantity
                            }
                        });
                    }
                }
            }
        }

        // 4. Trigger real-time events
        try {
            await triggerRealtimeEvent(`order-${orderId}`, 'status-updated', {
                orderId,
                status: 'CANCELLED'
            });
            await triggerRealtimeEvent(`user-${order.userId}`, 'order-updated', {
                orderId,
                status: 'CANCELLED',
                message: `Your order #${orderId.substring(0, 8)} has been cancelled.`
            });
        } catch (reError) {
            console.error('[OrdersService] Failed to trigger realtime events for cancel:', reError);
        }

        // 5. Audit Log
        createAuditLog(order.userId, 'ORDER_CANCELLED', null, {
            entity: 'Order',
            entityId: orderId,
            details: `Order cancelled. Restore cart: ${restoreCart}`,
            status: 'WARNING'
        }).catch(e => console.error('[OrdersService] Audit log failed:', e));

        return updatedOrder;
    });
}

/**
 * Automatically cancel unpaid orders that have expired (e.g., older than 24 hours)
 * @param {number} expiryHours - Hours before an unpaid order expires (default: 24)
 * @returns {Promise<object>} - Results of the cancellation process
 */
export async function cancelExpiredUnpaidOrders(expiryHours = 24) {
    try {
        const thresholdDate = new Date();
        thresholdDate.setHours(thresholdDate.getHours() - expiryHours);

        // 1. Find unpaid orders older than threshold
        // We only cancel non-COD orders that are still pending payment
        const expiredOrders = await prisma.order.findMany({
            where: {
                isPaid: false,
                paymentStatus: 'awaiting_payment',
                paymentMethod: { not: 'COD' },
                status: 'ORDER_PLACED',
                createdAt: { lt: thresholdDate }
            },
            select: { id: true }
        });

        console.log(`[OrdersService] Found ${expiredOrders.length} expired unpaid orders`);

        if (expiredOrders.length === 0) {
            return {
                processed: 0,
                cancelled: 0,
                errors: 0
            };
        }

        // 2. Process each order
        let cancelledCount = 0;
        let errorCount = 0;
        const processedIds = [];

        for (const order of expiredOrders) {
            try {
                await cancelOrder(order.id, true); // Restore items to cart
                cancelledCount++;
                processedIds.push(order.id);
            } catch (err) {
                console.error(`[OrdersService] Failed to cancel order ${order.id}:`, err);
                errorCount++;
            }
        }

        return {
            processed: expiredOrders.length,
            cancelled: cancelledCount,
            errors: errorCount,
            cancelledIds: processedIds
        };
    } catch (error) {
        console.error('[OrdersService] Error in cancelExpiredUnpaidOrders:', error);
        throw error;
    }
}

/**
 * Update order status with side effects (payment, escrow, etc.)
 * @param {string} orderId - Order ID
 * @param {object} updateData - Status and payment data
 * @returns {Promise<object>} - Updated order
 */
export async function updateOrderStatus(orderId, updateData) {
    const { status, isPaid, paymentStatus, paymentMethod: newPaymentMethod } = updateData;

    // 1. Get current order state
    const currentOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: { 
            store: true, 
            user: true,
            orderItems: true // Include items for cart cleanup
        }
    });

    if (!currentOrder) throw new Error('Order not found');

    const updatedFields = {};
    if (status) updatedFields.status = status;
    if (isPaid !== undefined) updatedFields.isPaid = isPaid;
    if (paymentStatus) updatedFields.paymentStatus = paymentStatus;

    // 2. Special Logic: COD Order Delivered
    const isCod = currentOrder.paymentMethod === 'COD' || newPaymentMethod === 'COD';

    // 2.1. Cart Cleanup Logic for Async Payments (GCash, Maya, etc.)
    // If the order is now PAID (via webhook or return page), we must ensure items are removed from the cart.
    // This is a fallback in case createOrder() didn't clear them or if the user abandoned and returned.
    const isNowPaid = (isPaid === true) || (status === 'PAID') || (paymentStatus === 'paid') || (paymentStatus === 'succeeded');
    const wasNotPaid = !currentOrder.isPaid;
    let cartWasCleared = false;

    if (isNowPaid && wasNotPaid) {
        console.log(`[OrdersService] Order ${orderId} is now PAID. Cleaning up cart items...`);
        try {
            // Fix: Delete only specific variations that were purchased
            const cartCleanupConditions = currentOrder.orderItems.map(item => {
                // Robust matching: If variationId is null/empty, match both in DB to be safe
                if (!item.variationId) {
                    return {
                        productId: item.productId,
                        OR: [
                            { variationId: null },
                            { variationId: '' }
                        ]
                    };
                }
                
                return {
                    productId: item.productId,
                    variationId: item.variationId
                };
            });

            if (cartCleanupConditions.length > 0) {
                const deleted = await prisma.cartItem.deleteMany({
                    where: {
                        cart: { userId: currentOrder.userId },
                        OR: cartCleanupConditions
                    }
                });
                console.log(`[OrdersService] Removed ${deleted.count} items from cart for User ${currentOrder.userId}`);
                cartWasCleared = true;
            }
        } catch (cleanupError) {
            console.error(`[OrdersService] Failed to cleanup cart for order ${orderId}:`, cleanupError);
            // Non-blocking, don't fail the status update
        }
    }

    if (status === 'DELIVERED' && isCod && !currentOrder.isPaid && !isPaid) {
        // When COD is delivered, mark as paid automatically
        updatedFields.isPaid = true;
        updatedFields.paymentStatus = 'cod_paid';
        updatedFields.paidAt = new Date();

        // Use escrow service to credit pending balance to seller
        // This handles platform fees (5%) and net earnings
        try {
            await creditPendingBalance({
                orderId: currentOrder.id,
                amount: currentOrder.total,
                gateway: 'COD'
            });
            console.log(`[OrdersService] Credited seller wallet for COD order ${orderId}`);
        } catch (escrowError) {
            console.error(`[OrdersService] Failed to credit escrow for order ${orderId}:`, escrowError);
            // We still update the order status even if escrow fails, but log it
        }
    }



    // 3. Update the order
    const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: updatedFields,
        include: {
            orderItems: { include: { product: true } },
            store: true,
            user: true
        }
    });

    // 4. Trigger real-time events for status updates
    try {
        await triggerRealtimeEvent(`order-${orderId}`, 'status-updated', {
            orderId,
            status: updatedOrder.status,
            isPaid: updatedOrder.isPaid
        });

        await triggerRealtimeEvent(`user-${updatedOrder.userId}`, 'order-updated', {
            orderId,
            status: updatedOrder.status,
            message: `Your order #${orderId.substring(0, 8)} is now ${updatedOrder.status.replace('_', ' ')}`
        });

        if (cartWasCleared) {
            await triggerRealtimeEvent(`user-${updatedOrder.userId}`, 'cart-updated', {
                userId: updatedOrder.userId,
                reason: 'payment_success'
            });
        }
    } catch (reError) {
        console.error('[OrdersService] Failed to trigger realtime events for update:', reError);
    }

    // 5. Audit Log
    createAuditLog(updatedOrder.userId, 'ORDER_STATUS_UPDATE', null, {
        entity: 'Order',
        entityId: orderId,
        details: `Order status updated to ${updatedOrder.status}`,
        metadata: {
            oldStatus: currentOrder.status,
            newStatus: updatedOrder.status,
            paymentStatus: updatedOrder.paymentStatus,
            isPaid: updatedOrder.isPaid
        }
    }).catch(e => console.error('[OrdersService] Audit log failed:', e));

    return updatedOrder;
}

/**
 * Link a payment (e.g., PayMongo) to an order
 */
export async function linkPaymentToOrder(orderId, paymentData) {
    const { paymentId, paymentMethod, paymentStatus, amount } = paymentData;

    return await prisma.order.update({
        where: { id: orderId },
        data: {
            paymentStatus,
            paymentMethod: paymentMethod.toUpperCase(),
            isPaid: paymentStatus === 'paid' || paymentStatus === 'succeeded',
            paidAt: (paymentStatus === 'paid' || paymentStatus === 'succeeded') ? new Date() : null,
            // In a real app, you'd store the paymentId in a separate table or a Json field
        }
    });
}

/**
 * Find order by external payment intent/session ID
 * Note: This requires the payment ID to be stored on the order or a related record
 */
export async function findOrderByPaymentIntent(paymentIntentId) {
    // This implementation depends on how you store the paymentIntentId
    // For now, let's assume it's in a metadata field or we search by some criteria
    return await prisma.order.findFirst({
        where: {
            OR: [
                { id: paymentIntentId }, // Fallback if ID is used
                // Add logic for where you store external payment IDs
            ]
        }
    });
}



