import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export async function GET(request) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        // Get total orders and GMV
        const orders = await prisma.order.findMany({
            select: {
                total: true,
                shippingCost: true,
                status: true
            }
        })

        const totalOrders = orders.length
        const totalGMV = orders.reduce((sum, order) => sum + order.total, 0)

        // Calculate commission (10% of product total, excluding shipping)
        const commissionRate = 0.10
        const totalCommission = orders.reduce((sum, order) => {
            const productTotal = order.total - order.shippingCost
            return sum + (productTotal * commissionRate)
        }, 0)

        // Get total users
        const totalUsers = await prisma.user.count()
        const totalBuyers = await prisma.user.count({
            where: { accountType: 'BUYER' }
        })
        const totalSellers = await prisma.user.count({
            where: { accountType: 'SELLER' }
        })

        // Get total stores
        const totalStores = await prisma.store.count()
        const activeStores = await prisma.store.count({
            where: { isActive: true }
        })
        const pendingVerification = await prisma.store.count({
            where: { verificationStatus: 'PENDING' }
        })

        // Get total products
        const totalProducts = await prisma.product.count()

        // Get pending payouts
        const pendingPayouts = await prisma.payoutRequest.count({
            where: { status: 'PENDING' }
        })
        const pendingPayoutAmount = await prisma.payoutRequest.aggregate({
            where: { status: 'PENDING' },
            _sum: { amount: true }
        })

        // Order status breakdown
        const ordersByStatus = await prisma.order.groupBy({
            by: ['status'],
            _count: true
        })

        // Recent orders (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const recentOrders = await prisma.order.count({
            where: {
                createdAt: {
                    gte: thirtyDaysAgo
                }
            }
        })

        const recentGMV = await prisma.order.aggregate({
            where: {
                createdAt: {
                    gte: thirtyDaysAgo
                }
            },
            _sum: { total: true }
        })

        return NextResponse.json({
            overview: {
                totalOrders,
                totalGMV,
                totalCommission,
                totalUsers,
                totalStores,
                activeStores,
                totalProducts
            },
            users: {
                total: totalUsers,
                buyers: totalBuyers,
                sellers: totalSellers
            },
            stores: {
                total: totalStores,
                active: activeStores,
                pendingVerification
            },
            payouts: {
                pending: pendingPayouts,
                pendingAmount: pendingPayoutAmount._sum.amount || 0
            },
            orders: {
                byStatus: ordersByStatus,
                last30Days: recentOrders,
                last30DaysGMV: recentGMV._sum.total || 0
            }
        })
    } catch (error) {
        console.error('Error fetching analytics:', error)
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }
}
