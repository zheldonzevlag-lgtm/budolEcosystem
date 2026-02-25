import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST validate coupon
export async function POST(request) {
    try {
        const body = await request.json()
        const { code, userId } = body

        if (!code) {
            return NextResponse.json(
                { error: 'Coupon code is required' },
                { status: 400 }
            )
        }

        const coupon = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase() }
        })

        if (!coupon) {
            return NextResponse.json(
                { error: 'Invalid coupon code' },
                { status: 404 }
            )
        }

        // Check if coupon is expired
        if (new Date(coupon.expiresAt) < new Date()) {
            return NextResponse.json(
                { error: 'Coupon has expired' },
                { status: 400 }
            )
        }

        // Check if coupon is public - REMOVED to allow private codes
        // if (!coupon.isPublic) {
        //     return NextResponse.json(
        //         { error: 'Coupon is not available' },
        //         { status: 403 }
        //     )
        // }

        // If forNewUser is true, check if user has previous orders
        if (coupon.forNewUser && userId) {
            const userOrders = await prisma.order.findFirst({
                where: { userId }
            })

            if (userOrders) {
                return NextResponse.json(
                    { error: 'This coupon is only for new users' },
                    { status: 400 }
                )
            }
        }

        return NextResponse.json(coupon)
    } catch (error) {
        console.error('Error validating coupon:', error)
        return NextResponse.json(
            { error: 'Failed to validate coupon' },
            { status: 500 }
        )
    }
}

