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

        // Check if user already has membership or pending application
        const existingUser = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { isMember: true, membershipStatus: true }
        })

        if (existingUser.isMember) {
            return NextResponse.json(
                { error: 'You are already a Plus Member' },
                { status: 400 }
            )
        }

        if (existingUser.membershipStatus === 'PENDING') {
            return NextResponse.json(
                { error: 'Your membership application is pending approval' },
                { status: 400 }
            )
        }

        // Create membership application
        const user = await prisma.user.update({
            where: { id: decoded.userId },
            data: { membershipStatus: 'PENDING' }
        })

        return NextResponse.json({
            success: true,
            message: 'Membership application submitted. Waiting for admin approval.',
            user
        })
    } catch (error) {
        console.error('Membership application error:', error)
        return NextResponse.json(
            { error: 'Failed to submit membership application' },
            { status: 500 }
        )
    }
}
