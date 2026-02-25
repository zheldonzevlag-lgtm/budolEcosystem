import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

// GET all products (admin only - includes out of stock)
export async function GET(request) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const { searchParams } = new URL(request.url)
        const category = searchParams.get('category')
        const search = searchParams.get('search')
        const storeId = searchParams.get('storeId')
        const inStock = searchParams.get('inStock') // 'true' or 'false'
        const limit = parseInt(searchParams.get('limit')) || 100

        const where = {}
        if (category) where.category = category
        if (storeId) where.storeId = storeId
        if (inStock !== null) where.inStock = inStock === 'true'
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { store: { name: { contains: search, mode: 'insensitive' } } }
            ]
        }

        const products = await prisma.product.findMany({
            where,
            include: {
                store: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        logo: true,
                        isActive: true
                    }
                },
                _count: {
                    select: {
                        orderItems: true,
                        rating: true
                    }
                },
                rating: {
                    take: 5,
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                image: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        })

        const normalized = products.map(product => {
            let images = product.images
            if (typeof images === 'string') {
                try {
                    images = JSON.parse(images)
                } catch (e) {
                    images = [images]
                }
            }
            if (!Array.isArray(images)) {
                images = images ? [images] : []
            }

            let videos = product.videos
            if (typeof videos === 'string') {
                try {
                    videos = JSON.parse(videos)
                } catch (e) {
                    videos = [videos]
                }
            }
            if (!Array.isArray(videos)) {
                videos = videos ? [videos] : []
            }

            return { ...product, images, videos }
        })

        return NextResponse.json(normalized)
    } catch (error) {
        console.error('Error fetching products:', error)
        return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: 500 }
        )
    }
}
