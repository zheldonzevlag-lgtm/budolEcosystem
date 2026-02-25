import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

// GET - Fetch all membership applications
export async function GET(request) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search')

        const where = {
            AND: [
                {
                    OR: [
                        { membershipStatus: 'PENDING' },
                        { coopMembershipStatus: 'PENDING' }
                    ]
                }
            ]
        }

        if (search) {
            where.AND.push({
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } }
                ]
            })
        }

        // Fetch all users with pending membership applications
        const applications = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                membershipStatus: true,
                coopMembershipStatus: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: {
                updatedAt: 'desc'
            }
        })

        return NextResponse.json({ applications })
    } catch (error) {
        console.error('Fetch membership applications error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch applications' },
            { status: 500 }
        )
    }
}

// POST - Approve or reject membership application
export async function POST(request) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const body = await request.json()
        const { userId, type, action } = body // type: 'plus' or 'coop', action: 'approve' or 'reject'

        if (!userId || !type || !action) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        if (!['plus', 'coop'].includes(type) || !['approve', 'reject'].includes(action)) {
            return NextResponse.json(
                { error: 'Invalid type or action' },
                { status: 400 }
            )
        }

        // Update user based on type and action
        const updateData = {}

        if (type === 'plus') {
            if (action === 'approve') {
                updateData.membershipStatus = 'APPROVED'
                updateData.isMember = true
            } else {
                updateData.membershipStatus = 'REJECTED'
            }
        } else if (type === 'coop') {
            if (action === 'approve') {
                updateData.coopMembershipStatus = 'APPROVED'
                updateData.isCoopMember = true
            } else {
                updateData.coopMembershipStatus = 'REJECTED'
            }
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData
        })

        return NextResponse.json({
            success: true,
            message: `Membership ${action}d successfully`,
            user
        })
    } catch (error) {
        console.error('Membership approval error:', error)
        return NextResponse.json(
            { error: 'Failed to process membership application' },
            { status: 500 }
        )
    }
}
