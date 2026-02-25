import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

// GET admin dashboard data
export async function GET(request) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        // Get total products
        const products = await prisma.product.count()

        // Get total stores
        const stores = await prisma.store.count()

        // Get total orders
        const orders = await prisma.order.count()

        // Get total revenue (sum of all paid orders)
        const paidOrders = await prisma.order.findMany({
            where: {
                isPaid: true
            },
            select: {
                total: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        const revenue = paidOrders.reduce((sum, order) => sum + order.total, 0)

        // Get all orders for chart
        const allOrders = await prisma.order.findMany({
            select: {
                id: true,
                total: true,
                createdAt: true,
                status: true,
                isPaid: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json({
            products,
            revenue,
            orders,
            stores,
            allOrders
        })
    } catch (error) {
        console.error('Error fetching admin dashboard:', error)
        return NextResponse.json(
            { error: 'Failed to fetch admin dashboard' },
            { status: 500 }
        )
    }
}

