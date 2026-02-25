import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSystemSettings } from '@/lib/services/systemSettingsService'

// GET store dashboard data
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const storeId = searchParams.get('storeId')

        if (!storeId) {
            return NextResponse.json(
                { error: 'storeId is required' },
                { status: 400 }
            )
        }

        // Get system settings for escrow window
        const settings = await getSystemSettings()
        const protectionWindowDays = settings?.protectionWindowDays || 7

        // Get store
        const store = await prisma.store.findUnique({
            where: { id: storeId }
        })

        if (!store) {
            return NextResponse.json(
                { error: 'Store not found' },
                { status: 404 }
            )
        }

        // Get total products
        const totalProducts = await prisma.product.count({
            where: { storeId }
        })

        // Get total orders
        const totalOrders = await prisma.order.count({
            where: { storeId }
        })

        // Get total earnings (sum of all paid orders) and total sold products
        const orders = await prisma.order.findMany({
            where: {
                storeId,
                status: {
                    // Exclude cancelled and return statuses
                    notIn: ['REFUNDED', 'RETURN_APPROVED', 'CANCELLED', 'RETURN_REQUESTED']
                }
            },
            include: {
                orderItems: true
            }
        })

        const calculateEarnings = (orderList) => {
            return orderList.reduce((sum, order) => {
                // Strict check for unpaid non-COD orders
                if (order.status === 'ORDER_PLACED' && order.paymentMethod !== 'COD' && !order.isPaid) {
                    return sum;
                }

                const orderTotal = order.total
                const shippingCost = order.shippingCost || 0

                // Standard Practice: Seller earnings = (Product Price) - Commission.
                // Shipping fee is passed to the platform/courier, not the seller.
                const productTotal = orderTotal - shippingCost
                const commission = productTotal * 0.10 // 10% commission on products

                const earnings = productTotal - commission
                return sum + earnings
            }, 0)
        }

        // 1. Potential Earnings: "Incoming" (Processing, Shipped, or Placed/COD)
        // Does NOT include Delivered (that's Escrow) or Completed.
        const potentialOrders = orders.filter(o =>
            ['PROCESSING', 'SHIPPED'].includes(o.status) ||
            (o.status === 'ORDER_PLACED' && o.paymentMethod === 'COD')
        )
        const potentialEarnings = calculateEarnings(potentialOrders)

        // 2. In Escrow: "Pending Release" (Delivered)
        // Orders that are Delivered but not yet Completed.
        const escrowOrders = orders.filter(o => o.status === 'DELIVERED')
        const calculatedEscrow = calculateEarnings(escrowOrders)

        // 3. Wallet Data (Available Balance)
        const wallet = await prisma.wallet.findUnique({
            where: { storeId },
            select: {
                balance: true,
                pendingBalance: true
            }
        })

        const availableBalance = wallet?.balance || 0

        // Use calculated escrow if wallet pending is 0 (fallback for display sync issues)
        const pendingBalance = wallet?.pendingBalance > 0 ? wallet.pendingBalance : calculatedEscrow

        const totalSoldProducts = orders.reduce((sum, order) => {
            return sum + order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0)
        }, 0)

        // Get all ratings for products in this store
        const products = await prisma.product.findMany({
            where: { storeId },
            select: { id: true }
        })

        const productIds = products.map(p => p.id)

        const ratings = await prisma.rating.findMany({
            where: {
                productId: {
                    in: productIds
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true
                    }
                },
                product: {
                    select: {
                        id: true,
                        name: true,
                        category: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json({
            totalProducts,
            totalEarnings: availableBalance, // Card: Available Balance
            pendingEarnings: pendingBalance, // Card: In Escrow
            potentialEarnings: potentialEarnings, // Card: Potential Earnings
            totalOrders,
            totalSoldProducts,
            ratings,
            protectionWindowDays,
            // Wallet data for detailed view
            wallet: {
                available: availableBalance,
                pending: pendingBalance,
                total: availableBalance + pendingBalance
            }
        })
    } catch (error) {
        console.error('Error fetching store dashboard:', error)
        return NextResponse.json(
            { error: 'Failed to fetch store dashboard' },
            { status: 500 }
        )
    }
}

