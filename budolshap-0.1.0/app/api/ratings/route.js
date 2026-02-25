import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { triggerRealtimeEvent } from '@/lib/realtime'

// GET all ratings
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const productId = searchParams.get('productId')
        const userId = searchParams.get('userId')
        const orderId = searchParams.get('orderId')

        const where = {}
        if (productId) where.productId = productId
        if (userId) where.userId = userId
        if (orderId) where.orderId = orderId

        const ratings = await prisma.rating.findMany({
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
                product: {
                    select: {
                        id: true,
                        name: true,
                        category: true,
                        images: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(ratings)
    } catch (error) {
        console.error('Error fetching ratings:', error)
        return NextResponse.json(
            { error: 'Failed to fetch ratings' },
            { status: 500 }
        )
    }
}

// POST create new rating
export async function POST(request) {
    try {
        const body = await request.json()
        const { userId, productId, orderId, rating, review } = body

        if (!userId || !productId || !orderId || !rating || !review) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json(
                { error: 'Rating must be between 1 and 5' },
                { status: 400 }
            )
        }

        // Verify order exists and belongs to user
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                orderItems: {
                    where: {
                        productId: productId
                    }
                }
            }
        })

        if (!order || order.userId !== userId) {
            return NextResponse.json(
                { error: 'Invalid order' },
                { status: 400 }
            )
        }

        if (order.orderItems.length === 0) {
            return NextResponse.json(
                { error: 'Product not found in order' },
                { status: 400 }
            )
        }

        // Check if order has been delivered (e-commerce best practice: only rate after receiving product)
        const allowedStatuses = ['DELIVERED', 'COMPLETED'];
        if (!allowedStatuses.includes(order.status)) {
            return NextResponse.json(
                { error: 'You can only rate products after they have been delivered' },
                { status: 400 }
            )
        }

        // Check if rating already exists
        const existingRating = await prisma.rating.findUnique({
            where: {
                userId_productId_orderId: {
                    userId,
                    productId,
                    orderId
                }
            }
        })

        if (existingRating) {
            return NextResponse.json(
                { error: 'Rating already exists for this order' },
                { status: 400 }
            )
        }

        const newRating = await prisma.rating.create({
            data: {
                userId,
                productId,
                orderId,
                rating: parseInt(rating),
                review
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                },
                product: {
                    select: {
                        id: true,
                        name: true,
                        category: true,
                        images: true
                    }
                }
            }
        })

        // Real-time update
        await triggerRealtimeEvent(`user-${userId}`, 'rating-created', {
            orderId,
            productId,
            rating: newRating.rating,
            ratingId: newRating.id,
            review: newRating.review
        })

        return NextResponse.json(newRating, { status: 201 })
    } catch (error) {
        console.error('Error creating rating:', error)
        return NextResponse.json(
            { error: 'Failed to create rating' },
            { status: 500 }
        )
    }
}

