import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export async function GET(request) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const search = searchParams.get('search')

        const where = {}
        if (status) {
            where.status = status
        }

        if (search) {
            where.OR = [
                { store: { name: { contains: search, mode: 'insensitive' } } },
                { store: { email: { contains: search, mode: 'insensitive' } } },
                { store: { user: { name: { contains: search, mode: 'insensitive' } } } },
                { store: { user: { email: { contains: search, mode: 'insensitive' } } } }
            ]
        }

        const payouts = await prisma.payoutRequest.findMany({
            where,
            include: {
                store: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        user: {
                            select: {
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(payouts)
    } catch (error) {
        console.error('Error fetching payouts:', error)
        return NextResponse.json(
            { error: 'Failed to fetch payouts', details: error.message },
            { status: 500 }
        )
    }
}

export async function PUT(request) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const body = await request.json()
        const { payoutId, status } = body

        if (!payoutId || !status || !['APPROVED', 'REJECTED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
        }

        const payout = await prisma.payoutRequest.update({
            where: { id: payoutId },
            data: { status }
        })

        return NextResponse.json(payout)
    } catch (error) {
        console.error('Error updating payout:', error)
        return NextResponse.json({ error: 'Failed to update payout' }, { status: 500 })
    }
}
