import { prisma } from '@/lib/prisma';

/**
 * Performance Service
 * Handles calculation and updates of marketplace performance metrics (NFR, BRR, Penalty Points)
 */

/**
 * Update Store Performance Metrics (NFR)
 * @param {string} storeId - Store ID
 * @returns {Promise<object>} Updated store metrics
 */
export async function updateStorePerformance(storeId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Calculate Non-Fulfilment Rate (NFR)
    // NFR = (Seller-Cancelled + Auto-Cancelled + Returns due to Seller Fault) / Total Orders (excluding buyer cancellations)
    
    const totalOrders = await prisma.order.count({
        where: {
            storeId,
            createdAt: { gte: thirtyDaysAgo },
            status: { not: 'CANCELLED' } // Standard denominator excludes buyer-initiated cancellations
        }
    });

    if (totalOrders === 0) return { nfr: 0, penaltyPoints: 0 };

    const nonFulfilledOrders = await prisma.order.count({
        where: {
            storeId,
            createdAt: { gte: thirtyDaysAgo },
            OR: [
                { status: 'CANCELLED', updatedAt: { gte: thirtyDaysAgo } }, // This would need a way to distinguish seller vs buyer cancellation
                { returns: { some: { reason: { in: ['WRONG_ITEM', 'DAMAGED_ITEM', 'DEFECTIVE', 'EXPIRED_ITEM', 'MISSING_ITEMS', 'ITEM_NOT_AS_DESCRIBED'] } } } }
            ]
        }
    });

    const nfr = (nonFulfilledOrders / totalOrders) * 100;

    // 2. Calculate Penalty Points
    // Simple logic: 1 point for every 5% NFR above 10%
    let penaltyPoints = 0;
    if (nfr > 10) {
        penaltyPoints = Math.floor((nfr - 10) / 5);
    }

    const updatedStore = await prisma.store.update({
        where: { id: storeId },
        data: {
            nonFulfilmentRate: nfr,
            penaltyPoints: penaltyPoints
        }
    });

    console.log(`[Performance] Store ${storeId} metrics updated: NFR=${nfr.toFixed(2)}%, Points=${penaltyPoints}`);
    
    return {
        nfr: updatedStore.nonFulfilmentRate,
        penaltyPoints: updatedStore.penaltyPoints
    };
}

/**
 * Update Buyer Performance Metrics (BRR)
 * @param {string} userId - User ID
 * @returns {Promise<object>} Updated buyer metrics
 */
export async function updateBuyerPerformance(userId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Calculate Buyer Return Rate (BRR)
    const totalOrders = await prisma.order.count({
        where: {
            userId,
            createdAt: { gte: thirtyDaysAgo }
        }
    });

    if (totalOrders === 0) return { brr: 0 };

    const returnedOrders = await prisma.order.count({
        where: {
            userId,
            createdAt: { gte: thirtyDaysAgo },
            status: 'REFUNDED'
        }
    });

    const brr = (returnedOrders / totalOrders) * 100;

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            buyerReturnRate: brr
        }
    });

    console.log(`[Performance] Buyer ${userId} metrics updated: BRR=${brr.toFixed(2)}%`);
    
    return {
        brr: updatedUser.buyerReturnRate
    };
}

/**
 * Increment COD Unpaid Count for a buyer
 * @param {string} userId - User ID
 * @returns {Promise<number>} New COD unpaid count
 */
export async function incrementCodUnpaid(userId) {
    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            codUnpaidCount: { increment: 1 }
        }
    });

    console.log(`[Performance] Buyer ${userId} COD unpaid count incremented to ${user.codUnpaidCount}`);
    
    return user.codUnpaidCount;
}
