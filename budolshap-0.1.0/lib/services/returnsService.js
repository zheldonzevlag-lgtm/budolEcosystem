import { prisma } from '@/lib/prisma';
import { triggerRealtimeEvent } from '@/lib/realtime';
import { lockFunds, refundFromLocked, releaseFromLocked } from '@/lib/escrow';
import { updateStorePerformance, updateBuyerPerformance } from './performanceService';
import { createAuditLog } from '@/lib/audit';

/**
 * Returns Service
 * Handles business logic for Return & Refund requests
 */

/**
 * Calculate Return Shipping Fee (RSF) and who pays for it
 * @param {string} reason - Return reason
 * @returns {object} { rsfAmount: number, payer: 'BUYER' | 'SELLER' }
 */
export function calculateRSF(reason) {
    const sellerFaultReasons = [
        'WRONG_ITEM',
        'DAMAGED_ITEM',
        'DEFECTIVE',
        'EXPIRED_ITEM',
        'MISSING_ITEMS',
        'ITEM_NOT_AS_DESCRIBED'
    ];

    const isSellerFault = sellerFaultReasons.includes(reason?.toUpperCase());

    // Default RSF amount for MVP - in production this would query a shipping provider
    const rsfAmount = 50;

    return {
        rsfAmount: rsfAmount,
        payer: isSellerFault ? 'SELLER' : 'BUYER'
    };
}

/**
 * Get returns with filtering and pagination
 */
export async function getReturns(filters = {}) {
    const {
        status,
        type,
        storeId,
        userId,
        page = 1,
        limit = 20,
        search
    } = filters;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = {};
    if (status && status !== 'all') where.status = status;
    if (type && type !== 'all') where.type = type;
    if (storeId) where.order = { storeId };
    if (userId) where.order = { userId };

    if (search) {
        where.OR = [
            { id: { contains: search, mode: 'insensitive' } },
            { orderId: { contains: search, mode: 'insensitive' } },
            { order: { user: { name: { contains: search, mode: 'insensitive' } } } },
            { order: { store: { name: { contains: search, mode: 'insensitive' } } } }
        ];
    }

    const [returns, total] = await Promise.all([
        prisma.return.findMany({
            where,
            include: {
                order: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, image: true }
                        },
                        store: {
                            select: { id: true, name: true, logo: true }
                        },
                        orderItems: {
                            include: {
                                product: {
                                    select: { id: true, name: true, images: true }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take
        }),
        prisma.return.count({ where })
    ]);

    return {
        returns,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit)
        }
    };
}

/**
 * Get return details by ID
 */
export async function getReturnById(returnId) {
    return await prisma.return.findUnique({
        where: { id: returnId },
        include: {
            order: {
                include: {
                    user: true,
                    store: true,
                    orderItems: {
                        include: {
                            product: true
                        }
                    },
                    address: true,
                    shipping: true
                }
            }
        }
    });
}

/**
 * Create a new return/refund request
 */
export async function createReturnRequest({ orderId, userId, reason, type, refundAmount, images }) {
    return await prisma.$transaction(async (tx) => {
        // 1. Verify order exists and belongs to user
        const order = await tx.order.findUnique({
            where: { id: orderId },
            include: { user: true, store: true }
        });

        if (!order) throw new Error('Order not found');
        if (order.userId !== userId) throw new Error('Unauthorized');

        // 2. Verify order is in a returnable state
        const validReturnStatuses = ['DELIVERED', 'SHIPPED', 'PROCESSING', 'ORDER_PLACED'];
        if (!validReturnStatuses.includes(order.status)) {
            throw new Error(`Order status ${order.status} is not eligible for return`);
        }

        // 3. Calculate RSF and adjust refund amount if needed
        const { rsfAmount, payer } = calculateRSF(reason);
        let finalRefundAmount = refundAmount || order.total;

        // If buyer pays for return shipping, deduct it from their refund
        if (payer === 'BUYER' && type !== 'REFUND_ONLY') {
            finalRefundAmount = Math.max(0, finalRefundAmount - rsfAmount);
        }

        // 4. Create the return record
        const returnRequest = await tx.return.create({
            data: {
                orderId,
                reason,
                type: type || 'REFUND_ONLY',
                refundAmount: finalRefundAmount,
                images: images || [],
                status: 'PENDING',
                isEscrowLocked: true,
                deadline: new Date(new Date().getTime() + (3 * 24 * 60 * 60 * 1000)) // 3 days for seller to respond
            }
        });

        // 5. Lock funds in escrow
        await lockFunds({ orderId, amount: returnRequest.refundAmount });

        // 6. Update order status
        await tx.order.update({
            where: { id: orderId },
            data: { status: 'RETURN_REQUESTED' }
        });

        // 7. Trigger Realtime Events in parallel
        try {
            const orderUpdatePayload = {
                orderId,
                status: 'RETURN_REQUESTED'
            };

            await Promise.all([
                triggerRealtimeEvent(`store-${order.storeId}`, 'return-requested', {
                    orderId,
                    returnId: returnRequest.id,
                    buyerName: order.user?.name || 'A buyer',
                    rsfPayer: payer,
                    reason
                }),
                triggerRealtimeEvent(`store-${order.storeId}`, 'order-updated', orderUpdatePayload),
                triggerRealtimeEvent(`user-${order.userId}`, 'order-updated', orderUpdatePayload)
            ]);
        } catch (reError) {
            console.error('Failed to trigger return realtime events:', reError);
        }

        // 8. Audit Log
        createAuditLog(userId, 'RETURN_REQUESTED', null, {
            entity: 'Return',
            entityId: returnRequest.id,
            details: `Return requested for order ${orderId}. Reason: ${reason}`,
            metadata: { 
                refundAmount: finalRefundAmount,
                type,
                payer
            }
        }).catch(e => console.error('[ReturnsService] Audit log failed:', e));

        return returnRequest;
    });
}

/**
 * Get all returns with DISPUTED status for admin mediation
 */
export async function getDisputedReturns() {
    return await prisma.return.findMany({
        where: { status: 'DISPUTED' },
        include: {
            order: {
                include: {
                    user: true,
                    store: true
                }
            }
        },
        orderBy: { updatedAt: 'desc' }
    });
}

/**
 * Admin resolves a return dispute
 */
export async function resolveDispute({ returnId, resolution, adminId, adminNotes }) {
    return await prisma.$transaction(async (tx) => {
        const returnRequest = await tx.return.findUnique({
            where: { id: returnId },
            include: { order: true }
        });

        if (!returnRequest) throw new Error('Return request not found');
        if (returnRequest.status !== 'DISPUTED') throw new Error('Return is not in DISPUTED status');

        let newReturnStatus;
        let newOrderStatus;

        if (resolution === 'REFUND_BUYER') {
            newReturnStatus = 'REFUNDED';
            newOrderStatus = 'REFUNDED';

            // Process refund from locked funds
            await refundFromLocked({
                orderId: returnRequest.orderId,
                amount: returnRequest.refundAmount
            });

            // Update performance metrics
            await updateBuyerPerformance(returnRequest.order.userId);
            await updateStorePerformance(returnRequest.order.storeId);
        } else if (resolution === 'REJECT_RETURN') {
            newReturnStatus = 'REJECTED';
            newOrderStatus = 'COMPLETED'; // Assuming order completes if return is rejected by admin

            // Release locked funds back to seller's pending balance
            await releaseFromLocked({
                orderId: returnRequest.orderId,
                amount: returnRequest.refundAmount
            });
        } else {
            throw new Error('Invalid resolution type');
        }

        const updatedReturn = await tx.return.update({
            where: { id: returnId },
            data: {
                status: newReturnStatus,
                adminId,
                adminNotes,
                isEscrowLocked: false,
                updatedAt: new Date()
            }
        });

        await tx.order.update({
            where: { id: returnRequest.orderId },
            data: { status: newOrderStatus }
        });

        // Notify both parties in parallel for speed
        const orderUpdatePayload = {
            orderId: returnRequest.orderId,
            status: newOrderStatus
        };

        const eventData = {
            orderId: returnRequest.orderId,
            resolution,
            status: newReturnStatus
        };

        try {
            await Promise.all([
                triggerRealtimeEvent(`user-${returnRequest.order.userId}`, 'dispute-resolved', eventData),
                triggerRealtimeEvent(`user-${returnRequest.order.userId}`, 'order-updated', orderUpdatePayload),
                triggerRealtimeEvent(`store-${returnRequest.order.storeId}`, 'dispute-resolved', eventData),
                triggerRealtimeEvent(`store-${returnRequest.order.storeId}`, 'order-updated', orderUpdatePayload)
            ]);
        } catch (reError) {
            console.error('Failed to trigger dispute-resolved realtime events:', reError);
        }

        // Audit Log
        createAuditLog(adminId, 'DISPUTE_RESOLVED', null, {
            entity: 'Return',
            entityId: returnRequest.id,
            details: `Dispute resolved: ${resolution}`,
            metadata: { 
                adminId,
                resolution,
                newReturnStatus,
                newOrderStatus,
                adminNotes
            }
        }).catch(e => console.error('[ReturnsService] Audit log failed:', e));

        return updatedReturn;
    });
}


/**
 * Seller response to return request
 */
export async function respondToReturn({ returnId, storeId, action, reason, images, partialAmount }) {
    return await prisma.$transaction(async (tx) => {
        const returnRequest = await tx.return.findUnique({
            where: { id: returnId },
            include: { order: { include: { store: { include: { wallet: true } } } } }
        });

        if (!returnRequest) throw new Error('Return request not found');
        if (returnRequest.order.storeId !== storeId) throw new Error('Unauthorized');

        let newStatus = returnRequest.status;
        let orderStatus = returnRequest.order.status;
        let finalRefundAmount = returnRequest.refundAmount;

        if (action === 'ACCEPT') {
            newStatus = 'APPROVED';
            // If it's REFUND_ONLY, we process the refund immediately
            if (returnRequest.type === 'REFUND_ONLY') {
                newStatus = 'REFUNDED';
                orderStatus = 'REFUNDED';

                // Use the new escrow logic to refund from locked funds
                await refundFromLocked({
                    orderId: returnRequest.orderId,
                    amount: returnRequest.refundAmount
                });

                // Update performance metrics
                await updateBuyerPerformance(returnRequest.order.userId);
                await updateStorePerformance(returnRequest.order.storeId);

                // Unlock escrow status in DB
                await tx.return.update({
                    where: { id: returnId },
                    data: { isEscrowLocked: false }
                });
            } else {
                orderStatus = 'RETURN_APPROVED';
            }
        } else if (action === 'OFFER_PARTIAL') {
            // Seller offers a different amount. 
            if (!partialAmount) throw new Error('Partial refund amount is required');
            finalRefundAmount = partialAmount;
            newStatus = 'PENDING'; // Still pending buyer acceptance
        } else if (action === 'REJECT' || action === 'DISPUTE') {
            newStatus = 'DISPUTED';
            orderStatus = 'RETURN_DISPUTED';
        } else if (action === 'REQUEST_RETURN') {
            newStatus = 'APPROVED'; // Seller approved the request, now waiting for return
            orderStatus = 'RETURN_APPROVED';
        }

        const updatedReturn = await tx.return.update({
            where: { id: returnId },
            data: {
                status: newStatus,
                sellerAction: action,
                sellerReason: reason,
                refundAmount: finalRefundAmount,
                updatedAt: new Date()
            }
        });

        const hasStatusChanged = orderStatus !== returnRequest.order.status;
        const hasReturnStatusChanged = newStatus !== returnRequest.status;

        await tx.order.update({
            where: { id: returnRequest.orderId },
            data: { status: orderStatus }
        });

        // Notify parties if anything changed
        if (hasReturnStatusChanged || hasStatusChanged) {
            const returnUpdatePayload = {
                orderId: returnRequest.orderId,
                status: newStatus,
                action
            };
            const orderUpdatePayload = {
                orderId: returnRequest.orderId,
                status: orderStatus
            };

        try {
            // Notify all relevant parties in parallel
            await Promise.all([
                triggerRealtimeEvent(`user-${returnRequest.order.userId}`, 'return-updated', returnUpdatePayload),
                triggerRealtimeEvent(`store-${returnRequest.order.storeId}`, 'return-updated', returnUpdatePayload),
                triggerRealtimeEvent(`user-${returnRequest.order.userId}`, 'order-updated', orderUpdatePayload),
                triggerRealtimeEvent(`store-${returnRequest.order.storeId}`, 'order-updated', orderUpdatePayload)
            ]);
        } catch (reError) {
            console.error('Failed to trigger return-updated realtime events:', reError);
        }

        // Audit Log
        createAuditLog(returnRequest.order.store.userId, 'RETURN_SELLER_RESPONSE', null, {
            entity: 'Return',
            entityId: returnRequest.id,
            details: `Seller responded to return: ${action}`,
            metadata: {
                action,
                reason,
                newReturnStatus: newStatus,
                orderStatus,
                refundAmount: finalRefundAmount
            }
        }).catch(e => console.error('[ReturnsService] Audit log failed:', e));
        }

        return updatedReturn;
    });
}

/**
 * Seller receives the returned parcel
 */
export async function receiveReturn({ returnId, storeId }) {
    return await prisma.$transaction(async (tx) => {
        const returnRequest = await tx.return.findUnique({
            where: { id: returnId },
            include: { order: { include: { store: { include: { wallet: true } } } } }
        });

        if (!returnRequest) throw new Error('Return request not found');
        if (returnRequest.order.storeId !== storeId) throw new Error('Unauthorized');
        if (returnRequest.status !== 'DELIVERED') {
            throw new Error(`Cannot receive return when status is ${returnRequest.status}. Item must be delivered to store first.`);
        }

        // Process Refund using the new escrow logic
        await refundFromLocked({
            orderId: returnRequest.orderId,
            amount: returnRequest.refundAmount
        });

        // Update performance metrics
        await updateBuyerPerformance(returnRequest.order.userId);
        await updateStorePerformance(returnRequest.order.storeId);

        const currentReturnStatus = returnRequest.status;
        const currentOrderStatus = returnRequest.order.status;
        const nextReturnStatus = 'REFUNDED';
        const nextOrderStatus = 'REFUNDED';
        const hasReturnStatusChanged = currentReturnStatus !== nextReturnStatus;
        const hasOrderStatusChanged = currentOrderStatus !== nextOrderStatus;

        const updatedReturn = await tx.return.update({
            where: { id: returnId },
            data: {
                status: nextReturnStatus,
                isEscrowLocked: false,
                updatedAt: new Date()
            }
        });

        await tx.order.update({
            where: { id: returnRequest.orderId },
            data: { status: nextOrderStatus }
        });

        // Notify parties in parallel if status changed
        try {
            const promises = [];
            
            if (hasOrderStatusChanged) {
                const orderUpdatePayload = {
                    orderId: returnRequest.orderId,
                    status: 'REFUNDED'
                };
                promises.push(triggerRealtimeEvent(`user-${returnRequest.order.userId}`, 'order-updated', orderUpdatePayload));
                promises.push(triggerRealtimeEvent(`store-${returnRequest.order.storeId}`, 'order-updated', orderUpdatePayload));
            }

            if (hasReturnStatusChanged) {
                const returnUpdatePayload = {
                    orderId: returnRequest.orderId,
                    status: nextReturnStatus,
                    action: 'RECEIVE'
                };
                promises.push(triggerRealtimeEvent(`store-${returnRequest.order.storeId}`, 'return-updated', returnUpdatePayload));
                promises.push(triggerRealtimeEvent(`user-${returnRequest.order.userId}`, 'return-updated', returnUpdatePayload));
            }

            if (promises.length > 0) {
                await Promise.all(promises);
            }
        } catch (reError) {
            console.error('Failed to trigger return receive realtime events:', reError);
        }

        // Audit Log
        createAuditLog(returnRequest.order.store.userId, 'RETURN_RECEIVED', null, {
            entity: 'Return',
            entityId: returnRequest.id,
            details: `Return received by store. Refund processed.`,
            metadata: {
                orderId: returnRequest.orderId,
                refundAmount: returnRequest.refundAmount,
                status: nextReturnStatus
            }
        }).catch(e => console.error('[ReturnsService] Audit log failed:', e));

        return updatedReturn;
    });
}

/**
 * Process overdue return requests (Cron task)
 * 1. Auto-approve PENDING returns if seller deadline passed
 * 2. Auto-refund DELIVERED returns if seller receipt deadline passed
 */
export async function processOverdueReturns() {
    const now = new Date();

    // 1. Find overdue PENDING returns
    const pendingOverdue = await prisma.return.findMany({
        where: {
            status: 'PENDING',
            deadline: { lt: now }
        },
        include: { order: true }
    });

    console.log(`[ReturnsSweep] Found ${pendingOverdue.length} overdue PENDING returns`);

    for (const ret of pendingOverdue) {
        try {
            await respondToReturn({
                returnId: ret.id,
                storeId: ret.order.storeId,
                action: 'ACCEPT',
                reason: 'Auto-approved due to seller inactivity'
            });
            console.log(`[ReturnsSweep] Auto-approved return ${ret.id}`);
        } catch (error) {
            console.error(`[ReturnsSweep] Failed to auto-approve return ${ret.id}:`, error);
        }
    }

    // 2. Find overdue DELIVERED returns (seller hasn't confirmed receipt)
    // For now, if deadline is passed and status is DELIVERED, we auto-refund
    const deliveredOverdue = await prisma.return.findMany({
        where: {
            status: 'DELIVERED',
            deadline: { lt: now }
        },
        include: { order: true }
    });

    console.log(`[ReturnsSweep] Found ${deliveredOverdue.length} overdue DELIVERED returns`);

    for (const ret of deliveredOverdue) {
        try {
            await receiveReturn({
                returnId: ret.id,
                storeId: ret.order.storeId
            });
            console.log(`[ReturnsSweep] Auto-refunded delivered return ${ret.id}`);
        } catch (error) {
            console.error(`[ReturnsSweep] Failed to auto-refund return ${ret.id}:`, error);
        }
    }

    return {
        processed: pendingOverdue.length + deliveredOverdue.length,
        autoApproved: pendingOverdue.length,
        autoRefunded: deliveredOverdue.length
    };
}

/**
 * Get return details by order ID
 */
export async function getReturnByOrderId(orderId) {
    return await prisma.return.findFirst({
        where: { orderId },
        orderBy: { createdAt: 'desc' }
    });
}

/**
 * Buyer responds to seller's proposal (e.g. Partial Refund)
 */
export async function buyerRespondToProposal({ returnId, userId, action, reason }) {
    return await prisma.$transaction(async (tx) => {
        const returnRequest = await tx.return.findUnique({
            where: { id: returnId },
            include: { order: { include: { store: { include: { wallet: true } } } } }
        });

        if (!returnRequest) throw new Error('Return request not found');
        if (returnRequest.order.userId !== userId) throw new Error('Unauthorized');
        
        // Ensure there is a proposal to respond to
        if (returnRequest.sellerAction !== 'OFFER_PARTIAL') {
            throw new Error('No pending proposal from seller');
        }

        let newStatus = returnRequest.status;
        let orderStatus = returnRequest.order.status;

        if (action === 'ACCEPT_OFFER') {
            newStatus = 'REFUNDED';
            orderStatus = 'REFUNDED'; // Partial refund is still a refund state

            // Process refund of the agreed partial amount
            await refundFromLocked({
                orderId: returnRequest.orderId,
                amount: returnRequest.refundAmount
            });

            // Calculate remainder to release
            const totalLocked = returnRequest.order.total; // Assuming full order was locked
            const refundAmount = returnRequest.refundAmount;
            const remainder = totalLocked - refundAmount;
            
            if (remainder > 0) {
                 await releaseFromLocked({
                    orderId: returnRequest.orderId,
                    amount: remainder
                });
            }

            // Update performance metrics
            await updateBuyerPerformance(returnRequest.order.userId);
            await updateStorePerformance(returnRequest.order.storeId);

            // Unlock escrow status in DB
            await tx.return.update({
                where: { id: returnId },
                data: { isEscrowLocked: false }
            });

        } else if (action === 'REJECT_OFFER') {
            newStatus = 'DISPUTED';
            orderStatus = 'RETURN_DISPUTED';
        } else {
            throw new Error('Invalid action');
        }

        const updateData = {
            status: newStatus,
            buyerAction: action,
            updatedAt: new Date()
        };

        if (action === 'ACCEPT_OFFER') {
            updateData.isEscrowLocked = false;
        }

        const updatedReturn = await tx.return.update({
            where: { id: returnId },
            data: updateData
        });

        await tx.order.update({
            where: { id: returnRequest.orderId },
            data: { status: orderStatus }
        });

        // Notify parties
        const payload = {
            orderId: returnRequest.orderId,
            status: newStatus,
            action,
            reason
        };

        try {
            await Promise.all([
                triggerRealtimeEvent(`store-${returnRequest.order.storeId}`, 'return-updated', payload),
                triggerRealtimeEvent(`user-${returnRequest.order.userId}`, 'return-updated', payload),
                triggerRealtimeEvent(`store-${returnRequest.order.storeId}`, 'order-updated', { ...payload, status: orderStatus }),
                triggerRealtimeEvent(`user-${returnRequest.order.userId}`, 'order-updated', { ...payload, status: orderStatus })
            ]);
        } catch (reError) {
            console.error('Failed to trigger buyer-response realtime events:', reError);
        }

        // Audit Log
        createAuditLog(userId, 'RETURN_BUYER_RESPONSE', null, {
            entity: 'Return',
            entityId: returnRequest.id,
            details: `Buyer responded to proposal: ${action}`,
            metadata: {
                action,
                reason,
                newReturnStatus: newStatus,
                refundAmount: returnRequest.refundAmount
            }
        }).catch(e => console.error('[ReturnsService] Audit log failed:', e));

        return updatedReturn;
    });
}
