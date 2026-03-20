import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { normalizeAccountType } from '@/lib/accountTypes'
import { requireAdmin } from '@/lib/adminAuth'
import { adminUserInclude, attachAdminFlag, getAdminEmailSet } from './utils'

export const dynamic = 'force-dynamic'

// GET all users (admin only)
export async function GET(request) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search')
        const limit = parseInt(searchParams.get('limit')) || 100
        const includeDeleted = searchParams.get('includeDeleted') === 'true'

        const where = {}
        
        // Filter out soft-deleted users by default unless explicitly requested
        if (!includeDeleted) {
            where.deletedAt = null
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phoneNumber: { contains: search, mode: 'insensitive' } }
            ]
        }

        const users = await prisma.user.findMany({
            where,
            include: adminUserInclude,
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        })

        const adminEmailSet = getAdminEmailSet()
        const usersWithAdminFlag = users.map(user => attachAdminFlag(user, adminEmailSet))

        return NextResponse.json(usersWithAdminFlag)
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        )
    }
}

// POST create a new user on behalf of admin
export async function POST(request) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const body = await request.json()
        const { name, email, password, phoneNumber, address, accountType, role, image, emailVerified } = body

        if (!name || !email || !password || !phoneNumber || !accountType) {
            return NextResponse.json(
                { error: 'Name, email, password, phone number and account type are required' },
                { status: 400 }
            )
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters long' },
                { status: 400 }
            )
        }

        const normalizedAccountType = normalizeAccountType(accountType)
        if (!normalizedAccountType) {
            return NextResponse.json(
                { error: 'Invalid account type' },
                { status: 400 }
            )
        }

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { phoneNumber }
                ]
            }
        })

        if (existingUser) {
            const field = existingUser.email === email ? 'email' : 'phone number'
            return NextResponse.json(
                { error: `A user with this ${field} already exists` },
                { status: 409 }
            )
        }

        const hashedPassword = await hashPassword(password)
        const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9)
        const adminEmailSet = getAdminEmailSet()

        const userData = {
            id: userId,
            name,
            email,
            phoneNumber,
            password: hashedPassword,
            image: image ?? '',
            cart: {},
            accountType: normalizedAccountType,
            role: role ?? 'USER',
            emailVerified: (normalizedAccountType === 'ADMIN') || (emailVerified === true)
        }

        // Add address if provided
        if (address && Object.keys(address).length > 0) {
            userData.Address = {
                create: {
                    name: address.name || name,
                    email: address.email || email,
                    phone: address.phone || phoneNumber,
                    houseNumber: address.houseNumber || '',
                    street: address.street || address.detailedAddress || '',
                    barangay: address.barangay || '',
                    subdivision: address.subdivision || '',
                    landmark: address.landmark || '',
                    city: address.city || '',
                    state: address.state || '',
                    zip: address.zip || '',
                    country: address.country || 'Philippines',
                    latitude: address.latitude ? parseFloat(address.latitude) : null,
                    longitude: address.longitude ? parseFloat(address.longitude) : null,
                    buildingName: address.buildingName || '',
                    floorUnit: address.floorUnit || '',
                    notes: address.notes || ''
                }
            }
        }

        const createdUser = await prisma.user.create({
            data: userData,
            include: adminUserInclude
        })

        return NextResponse.json(
            attachAdminFlag(createdUser, adminEmailSet),
            { status: 201 }
        )
    } catch (error) {
        console.error('Error creating user:', error)
        return NextResponse.json(
            { error: 'Failed to create user' },
            { status: 500 }
        )
    }
}

