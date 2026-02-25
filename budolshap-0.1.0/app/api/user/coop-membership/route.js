import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function POST(request) {
    try {
        const decoded = getUserFromRequest(request)

        if (!decoded || !decoded.userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Check if user already has coop membership or pending application
        const existingUser = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { isCoopMember: true, coopMembershipStatus: true }
        })

        if (existingUser.isCoopMember) {
            return NextResponse.json(
                { error: 'You are already a Coop Member' },
                { status: 400 }
            )
        }

        if (existingUser.coopMembershipStatus === 'PENDING') {
            return NextResponse.json(
                { error: 'Your coop membership application is pending approval' },
                { status: 400 }
            )
        }

        // Create coop membership application
        const user = await prisma.user.update({
            where: { id: decoded.userId },
            data: { coopMembershipStatus: 'PENDING' }
        })

        return NextResponse.json({
            success: true,
            message: 'Coop membership application submitted. Waiting for admin approval.',
            user
        })
    } catch (error) {
        console.error('Coop membership application error:', error)
        return NextResponse.json(
            { error: 'Failed to submit coop membership application' },
            { status: 500 }
        )
    }
}
