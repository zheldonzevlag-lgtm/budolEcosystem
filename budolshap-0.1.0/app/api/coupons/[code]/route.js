import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

// DELETE coupon
export async function DELETE(request, { params }) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const { code } = await params

        if (!code) {
            return NextResponse.json(
                { error: 'Coupon code is required' },
                { status: 400 }
            )
        }

        await prisma.coupon.delete({
            where: { code }
        })

        return NextResponse.json({ message: 'Coupon deleted successfully' })
    } catch (error) {
        console.error('Error deleting coupon:', error)
        return NextResponse.json(
            { error: 'Failed to delete coupon' },
            { status: 500 }
        )
    }
}

// PUT update coupon
export async function PUT(request, { params }) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const { code } = await params
        const body = await request.json()
        const { description, discount, forNewUser, forMember, forCoopMember, isPublic, expiresAt } = body

        if (!code) {
            return NextResponse.json(
                { error: 'Coupon code is required' },
                { status: 400 }
            )
        }

        if (discount < 0 || discount > 100) {
            return NextResponse.json(
                { error: 'Discount must be between 0 and 100' },
                { status: 400 }
            )
        }

        const coupon = await prisma.coupon.update({
            where: { code },
            data: {
                description,
                discount: parseFloat(discount),
                forNewUser: forNewUser || false,
                forMember: forMember || false,
                forCoopMember: forCoopMember || false,
                isPublic: isPublic || false,
                expiresAt: new Date(expiresAt)
            }
        })

        return NextResponse.json(coupon)
    } catch (error) {
        console.error('Error updating coupon:', error)
        return NextResponse.json(
            { error: 'Failed to update coupon' },
            { status: 500 }
        )
    }
}
