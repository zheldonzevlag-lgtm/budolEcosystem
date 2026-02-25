import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

// GET all coupons
export async function GET(request) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const { searchParams } = new URL(request.url)
        const code = searchParams.get('code')
        const isPublic = searchParams.get('isPublic')
        const forNewUser = searchParams.get('forNewUser')
        const search = searchParams.get('search')

        const where = {}
        if (code) where.code = code
        if (isPublic !== null) where.isPublic = isPublic === 'true'
        if (forNewUser !== null) where.forNewUser = forNewUser === 'true'

        if (search) {
            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ]
        }
        const forMember = searchParams.get('forMember')
        if (forMember !== null) where.forMember = forMember === 'true'
        const forCoopMember = searchParams.get('forCoopMember')
        if (forCoopMember !== null) where.forCoopMember = forCoopMember === 'true'

        const includeExpired = searchParams.get('includeExpired')

        // Filter out expired coupons unless includeExpired is true
        if (includeExpired !== 'true') {
            where.expiresAt = {
                gte: new Date()
            }
        }

        const coupons = await prisma.coupon.findMany({
            where,
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(coupons)
    } catch (error) {
        console.error('Error fetching coupons:', error)
        return NextResponse.json(
            { error: 'Failed to fetch coupons' },
            { status: 500 }
        )
    }
}

// POST create new coupon
export async function POST(request) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const body = await request.json()
        const { code, description, discount, forNewUser, forMember, forCoopMember, isPublic, expiresAt } = body

        if (!code || !description || !discount || !expiresAt) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        if (discount < 0 || discount > 100) {
            return NextResponse.json(
                { error: 'Discount must be between 0 and 100' },
                { status: 400 }
            )
        }

        // Check if code already exists
        const existingCoupon = await prisma.coupon.findUnique({
            where: { code }
        })

        if (existingCoupon) {
            return NextResponse.json(
                { error: 'Coupon code already exists' },
                { status: 400 }
            )
        }

        const coupon = await prisma.coupon.create({
            data: {
                code: code.toUpperCase(),
                description,
                discount: parseFloat(discount),
                forNewUser: forNewUser || false,
                forMember: forMember || false,
                forCoopMember: forCoopMember || false,
                isPublic: isPublic || false,
                expiresAt: new Date(expiresAt)
            }
        })

        return NextResponse.json(coupon, { status: 201 })
    } catch (error) {
        console.error('Error creating coupon:', error)
        return NextResponse.json(
            { error: 'Failed to create coupon' },
            { status: 500 }
        )
    }
}

