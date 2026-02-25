import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendReturnRequestEmail } from '@/lib/email'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')
        const storeId = searchParams.get('storeId')
        const status = searchParams.get('status')

        const where = {}

        if (userId) {
            where.order = { userId }
        }

        if (storeId) {
            where.order = { storeId }
        }

        if (status) {
            where.status = status
        }

        const returns = await prisma.return.findMany({
            where,
            include: {
                order: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        },
                        store: {
                            select: {
                                id: true,
                                name: true
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
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(returns)
    } catch (error) {
        console.error('Error fetching returns:', error)
        return NextResponse.json({ error: 'Failed to fetch returns' }, { status: 500 })
    }
}
