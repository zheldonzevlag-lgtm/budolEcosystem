import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { respondToReturn, getReturnById } from '@/lib/services/returnsService'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request, { params }) {
    try {
        const { id } = await params
        const returnData = await getReturnById(id)

        if (!returnData) {
            return NextResponse.json({ error: 'Return request not found' }, { status: 404 })
        }

        return NextResponse.json(returnData)
    } catch (error) {
        console.error('Error fetching return:', error)
        return NextResponse.json({ error: 'Failed to fetch return' }, { status: 500 })
    }
}

export async function PUT(request, { params }) {
    try {
        const { id } = await params
        const decoded = getUserFromRequest(request)

        if (!decoded || !decoded.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { action, reason, images } = body

        // Fetch user's store
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { store: true }
        })

        if (!user || !user.store) {
            return NextResponse.json({ error: 'Seller account not found' }, { status: 403 })
        }

        const updatedReturn = await respondToReturn({
            returnId: id,
            storeId: user.store.id,
            action,
            reason,
            images
        })

        return NextResponse.json(updatedReturn)
    } catch (error) {
        console.error('Error updating return:', error)
        return NextResponse.json({ error: error.message || 'Failed to update return' }, { status: 500 })
    }
}
