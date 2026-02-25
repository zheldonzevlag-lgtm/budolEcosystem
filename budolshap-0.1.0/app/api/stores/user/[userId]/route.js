import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET store by userId
export async function GET(request, { params }) {
    try {
        const { userId } = await params
        console.log(`Fetching store for userId: ${userId}`)

        const store = await prisma.store.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                },
                _count: {
                    select: {
                        Product: true,
                        Order: true
                    }
                }
            }
        })

        if (!store) {
            console.log(`Store not found for userId: ${userId}`)
            // Return 200 with null instead of 404 to avoid console noise for regular users
            return NextResponse.json(null, { status: 200 })
        }

        console.log(`Store found: ${store.id}, isActive: ${store.isActive}`)
        return NextResponse.json(store)
    } catch (error) {
        console.error('Error fetching store:', error)
        return NextResponse.json(
            { error: 'Failed to fetch store' },
            { status: 500 }
        )
    }
}

