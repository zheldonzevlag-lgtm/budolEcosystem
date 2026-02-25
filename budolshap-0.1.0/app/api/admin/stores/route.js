import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export async function GET(request) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const { searchParams } = new URL(request.url)
        const verificationStatus = searchParams.get('verificationStatus')
        const search = searchParams.get('search')

        const where = {}
        if (verificationStatus) {
            where.verificationStatus = verificationStatus
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { username: { contains: search, mode: 'insensitive' } },
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } }
            ]
        }

        const stores = await prisma.store.findMany({
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
                wallet: {
                    select: {
                        balance: true
                    }
                },
                _count: {
                    select: {
                        Product: true,
                        Order: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(stores)
    } catch (error) {
        console.error('Error fetching stores:', error)
        return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 })
    }
}
