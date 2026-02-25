import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

// GET all orders (admin only)
export async function GET(request) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const search = searchParams.get('search')
        const storeId = searchParams.get('storeId')
        const limit = parseInt(searchParams.get('limit')) || 100

        const where = {}
        if (status) where.status = status
        if (storeId) where.storeId = storeId
        if (search) {
            where.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
                { store: { name: { contains: search, mode: 'insensitive' } } },
                { orderItems: { some: { product: { name: { contains: search, mode: 'insensitive' } } } } }
            ]
        }

        const orders = await prisma.order.findMany({
            where,
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
                        username: true
                    }
                },
                orderItems: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                images: true
                            }
                        }
                    }
                },
                address: true,
                paymentProof: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        })

        return NextResponse.json(orders)
    } catch (error) {
        console.error('Error fetching orders:', error)
        return NextResponse.json(
            { error: 'Failed to fetch orders' },
            { status: 500 }
        )
    }
}
