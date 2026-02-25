import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

async function getAuthenticatedStore(request) {
    const token = request.cookies.get('budolshap_token')?.value || request.cookies.get('token')?.value
    if (!token) return null

    const decoded = verifyToken(token)
    if (!decoded || !decoded.id) return null

    const store = await prisma.store.findUnique({
        where: { userId: decoded.id }
    })

    return store
}

export async function GET(request) {
    try {
        const store = await getAuthenticatedStore(request)
        if (!store) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const coupons = await prisma.coupon.findMany({
            where: { storeId: store.id },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(coupons)
    } catch (error) {
        console.error('Error fetching coupons:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const store = await getAuthenticatedStore(request)
        if (!store) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { code, description, discount, expiresAt, isPublic } = body

        if (!code || !description || !discount || !expiresAt) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Check if coupon code exists
        const existingCoupon = await prisma.coupon.findUnique({
            where: { code }
        })

        if (existingCoupon) {
            return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 })
        }

        const coupon = await prisma.coupon.create({
            data: {
                code,
                description,
                discount: Number(discount),
                forNewUser: false, // Default for store coupons? Or allow config?
                isPublic: isPublic || false,
                expiresAt: new Date(expiresAt),
                storeId: store.id
            }
        })

        return NextResponse.json(coupon, { status: 201 })
    } catch (error) {
        console.error('Error creating coupon:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
