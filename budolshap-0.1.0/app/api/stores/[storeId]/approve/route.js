import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

// PUT approve store
export async function PUT(request, { params }) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const { storeId } = await params
        const body = await request.json()
        const { status, isActive } = body

        const store = await prisma.store.update({
            where: { id: storeId },
            data: {
                ...(status && { status }),
                ...(isActive !== undefined && { isActive })
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                }
            }
        })

        return NextResponse.json(store)
    } catch (error) {
        console.error('Error approving store:', error)
        return NextResponse.json(
            { error: 'Failed to approve store' },
            { status: 500 }
        )
    }
}

