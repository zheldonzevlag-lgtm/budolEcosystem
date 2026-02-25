// Checkout Service - Phase 2: Session Robustness
// Enhanced checkout session management with expiration and cleanup

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';



/**
 * Checkout Session Configuration
 */
const CHECKOUT_CONFIG = {
    SESSION_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
    CLEANUP_BATCH_SIZE: 100,
    MAX_RETRY_ATTEMPTS: 3,
    RETRY_DELAY_MS: 1000
};

/**
 * Create a new checkout session with enhanced validation and session management
 * @param {Object} params - Checkout parameters
 * @param {string} params.userId - User ID
 * @param {number} params.total - Total amount
 * @param {string} params.currency - Currency code (default: PHP)
 * @param {Object} params.metadata - Additional metadata
 * @returns {Promise<Object>} - Created checkout session
 */
export async function createCheckoutSession({
    userId,
    total,
    currency = 'PHP',
    metadata = {}
}) {
    try {
        // Validate input
        if (!userId || !total || total <= 0) {
            throw new Error('Invalid checkout parameters');
        }

        // Clean up expired sessions for this user first
        await cleanupExpiredUserSessions(userId);

        // Create new checkout session
        const checkout = await prisma.checkout.create({
            data: {
                userId,
                total,
                currency,
                status: 'PENDING',
                expiresAt: new Date(Date.now() + CHECKOUT_CONFIG.SESSION_TIMEOUT_MS),
                sessionId: randomUUID(),
                metadata: JSON.stringify(metadata),
                attemptCount: 0
            }
        });

        console.log(`✅ Checkout session created: ${checkout.id} for user ${userId}`);
        return checkout;
    } catch (error) {
        console.error('❌ Failed to create checkout session:', error);
        throw error;
    }
}

/**
 * Get active checkout session by ID with validation
 * @param {string} checkoutId - Checkout ID
 * @param {string} userId - User ID (for validation)
 * @returns {Promise<Object|null>} - Checkout session or null
 */
export async function getCheckoutSession(checkoutId, userId = null) {
    try {
        const checkout = await prisma.checkout.findUnique({
            where: { id: checkoutId }
        });

        if (!checkout) {
            return null;
        }

        // Validate user ownership if provided
        if (userId && checkout.userId !== userId) {
            throw new Error('Unauthorized access to checkout session');
        }

        // Check if session is expired
        if (checkout.expiresAt && new Date() > checkout.expiresAt) {
            await expireCheckoutSession(checkoutId);
            return null;
        }

        return checkout;
    } catch (error) {
        console.error('❌ Failed to get checkout session:', error);
        throw error;
    }
}

/**
 * Update checkout session status with retry logic
 * @param {string} checkoutId - Checkout ID
 * @param {Object} updates - Updates to apply
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<Object>} - Updated checkout session
 */
export async function updateCheckoutSession(checkoutId, updates, retryCount = 0) {
    try {
        const checkout = await prisma.checkout.update({
            where: { id: checkoutId },
            data: {
                ...updates,
                updatedAt: new Date(),
                attemptCount: { increment: 1 }
            }
        });

        console.log(`✅ Checkout session updated: ${checkoutId} status: ${updates.status}`);
        return checkout;
    } catch (error) {
        if (retryCount < CHECKOUT_CONFIG.MAX_RETRY_ATTEMPTS) {
            console.log(`🔄 Retry attempt ${retryCount + 1} for checkout ${checkoutId}`);
            await new Promise(resolve => setTimeout(resolve, CHECKOUT_CONFIG.RETRY_DELAY_MS));
            return updateCheckoutSession(checkoutId, updates, retryCount + 1);
        }
        console.error('❌ Failed to update checkout session after max retries:', error);
        throw error;
    }
}

/**
 * Mark checkout session as paid
 * @param {string} checkoutId - Checkout ID
 * @param {string} paymentId - Payment ID
 * @param {string} paymentProvider - Payment provider
 * @returns {Promise<Object>} - Updated checkout session
 */
export async function markCheckoutAsPaid(checkoutId, paymentId, paymentProvider) {
    return await updateCheckoutSession(checkoutId, {
        status: 'PAID',
        paymentId,
        paymentProvider,
        paidAt: new Date()
    });
}

/**
 * Mark checkout session as expired
 * @param {string} checkoutId - Checkout ID
 * @returns {Promise<Object>} - Updated checkout session
 */
export async function expireCheckoutSession(checkoutId) {
    return await updateCheckoutSession(checkoutId, {
        status: 'EXPIRED',
        expiredAt: new Date()
    });
}

/**
 * Mark checkout session as failed
 * @param {string} checkoutId - Checkout ID
 * @param {string} failureReason - Reason for failure
 * @returns {Promise<Object>} - Updated checkout session
 */
export async function markCheckoutAsFailed(checkoutId, failureReason) {
    return await updateCheckoutSession(checkoutId, {
        status: 'FAILED',
        failureReason,
        failedAt: new Date()
    });
}

/**
 * Cleanup expired sessions for a specific user
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Number of cleaned up sessions
 */
export async function cleanupExpiredUserSessions(userId) {
    try {
        const expiredSessions = await prisma.checkout.findMany({
            where: {
                userId,
                status: 'PENDING',
                expiresAt: { lt: new Date() }
            },
            select: { id: true }
        });

        if (expiredSessions.length === 0) {
            return 0;
        }

        // Restore stock for expired sessions with orders
        for (const session of expiredSessions) {
            await restoreStockForExpiredCheckout(session.id);
        }

        // Mark sessions as expired
        const result = await prisma.checkout.updateMany({
            where: {
                id: { in: expiredSessions.map(s => s.id) }
            },
            data: {
                status: 'EXPIRED',
                expiredAt: new Date()
            }
        });

        console.log(`🧹 Cleaned up ${result.count} expired sessions for user ${userId}`);
        return result.count;
    } catch (error) {
        console.error('❌ Failed to cleanup expired user sessions:', error);
        throw error;
    }
}

/**
 * Restore stock for expired checkout session
 * @param {string} checkoutId - Checkout ID
 * @returns {Promise<void>}
 */
async function restoreStockForExpiredCheckout(checkoutId) {
    try {
        // Get all orders linked to this checkout
        const orders = await prisma.order.findMany({
            where: { checkoutId },
            include: { orderItems: true }
        });

        // Restore stock for each order item
        for (const order of orders) {
            for (const item of order.orderItems) {
                const product = await prisma.product.findUnique({
                    where: { id: item.productId }
                });

                if (product) {
                    if (item.variationId && product.variation_matrix) {
                        // Restore variation stock
                        const matrix = JSON.parse(JSON.stringify(product.variation_matrix));
                        const variantIndex = matrix.findIndex(v => v.sku === item.variationId);
                        
                        if (variantIndex !== -1) {
                            matrix[variantIndex].stock += item.quantity;
                            const totalStock = matrix.reduce((acc, v) => acc + (v.stock || 0), 0);
                            
                            await prisma.product.update({
                                where: { id: item.productId },
                                data: {
                                    variation_matrix: matrix,
                                    stock: totalStock,
                                    inStock: totalStock > 0
                                }
                            });
                        }
                    } else {
                        // Restore product stock
                        await prisma.product.update({
                            where: { id: item.productId },
                            data: {
                                stock: { increment: item.quantity },
                                inStock: true
                            }
                        });
                    }
                    
                    console.log(`🔄 Restored stock for product ${item.productId}: +${item.quantity}`);
                }
            }
        }
    } catch (error) {
        console.error('❌ Failed to restore stock for expired checkout:', error);
        // Non-fatal error, continue cleanup
    }
}

/**
 * Global cleanup of expired checkout sessions (for cron job)
 * @returns {Promise<number>} - Number of cleaned up sessions
 */
export async function cleanupExpiredSessions() {
    try {
        const expiredSessions = await prisma.checkout.findMany({
            where: {
                status: 'PENDING',
                expiresAt: { lt: new Date() }
            },
            take: CHECKOUT_CONFIG.CLEANUP_BATCH_SIZE,
            select: { id: true, userId: true }
        });

        if (expiredSessions.length === 0) {
            return 0;
        }

        let totalCleaned = 0;

        // Process in batches to avoid overwhelming the database
        for (const session of expiredSessions) {
            try {
                await restoreStockForExpiredCheckout(session.id);
                
                await prisma.checkout.update({
                    where: { id: session.id },
                    data: {
                        status: 'EXPIRED',
                        expiredAt: new Date()
                    }
                });

                totalCleaned++;
                console.log(`🧹 Cleaned up expired session: ${session.id}`);
            } catch (error) {
                console.error(`❌ Failed to cleanup session ${session.id}:`, error);
            }
        }

        console.log(`🧹 Global cleanup completed: ${totalCleaned} sessions cleaned`);
        return totalCleaned;
    } catch (error) {
        console.error('❌ Global cleanup failed:', error);
        throw error;
    }
}

/**
 * Get checkout statistics for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Checkout statistics
 */
export async function getCheckoutStats(userId) {
    try {
        const stats = await prisma.checkout.aggregate({
            where: { userId },
            _count: {
                id: true
            },
            _sum: {
                total: true
            }
        });

        const statusCounts = await prisma.checkout.groupBy({
            where: { userId },
            by: ['status'],
            _count: {
                id: true
            }
        });

        return {
            totalCheckouts: stats._count.id,
            totalAmount: stats._sum.total || 0,
            statusBreakdown: statusCounts.reduce((acc, item) => {
                acc[item.status] = item._count.id;
                return acc;
            }, {})
        };
    } catch (error) {
        console.error('❌ Failed to get checkout stats:', error);
        throw error;
    }
}

export { CHECKOUT_CONFIG };