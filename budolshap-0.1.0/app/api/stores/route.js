import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all stores
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const isActive = searchParams.get('isActive')
        const username = searchParams.get('username')

        const where = {}
        if (status) where.status = status
        if (isActive !== null) where.isActive = isActive === 'true'
        if (username) where.username = username

        const stores = await prisma.store.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                },
                addresses: {
                    where: { isDefault: true },
                    take: 1
                },
                _count: {
                    select: {
                        Product: true,
                        Order: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(stores)
    } catch (error) {
        console.error('Error fetching stores:', error)
        return NextResponse.json(
            { error: 'Failed to fetch stores' },
            { status: 500 }
        )
    }
}

// POST create new store
export async function POST(request) {
    try {
        const body = await request.json()
        const { userId, name, username, email, contact, description, address, structuredAddress, logo } = body

        if (!userId || !name || !username || !email || !contact || !description || !address) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Check if user already has a store
        const existingStore = await prisma.store.findUnique({
            where: { userId }
        })

        if (existingStore) {
            return NextResponse.json(
                { error: 'User already has a store' },
                { status: 400 }
            )
        }

        // Check if username is taken
        const usernameExists = await prisma.store.findUnique({
            where: { username }
        })

        if (usernameExists) {
            return NextResponse.json(
                { error: 'Username already taken' },
                { status: 400 }
            )
        }

        // Prepare store data
        const storeData = {
            userId,
            name,
            username,
            email,
            contact,
            description,
            address, // formatted address string
            logo: logo || '',
            status: 'pending',
            isActive: false
        }

        // If structured address is provided, include it in the creation
        // This creates the logic link to StoreAddress which prevents "Legacy" status
        if (structuredAddress) {
            storeData.addresses = {
                create: {
                    phone: structuredAddress.phone || contact,
                    district: structuredAddress.district,
                    province: structuredAddress.province || '',
                    city: structuredAddress.city,
                    barangay: structuredAddress.barangay,
                    detailedAddress: structuredAddress.detailedAddress,
                    zip: structuredAddress.zip,
                    country: structuredAddress.country || 'Philippines',
                    latitude: structuredAddress.latitude || null,
                    longitude: structuredAddress.longitude || null,
                    isDefault: true,
                    notes: structuredAddress.notes || ''
                }
            }
        }

        const store = await prisma.store.create({
            data: storeData,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                },
                addresses: true // Return created addresses
            }
        })

        return NextResponse.json(store, { status: 201 })
    } catch (error) {
        console.error('Error creating store:', error)
        return NextResponse.json(
            { error: 'Failed to create store' },
            { status: 500 }
        )
    }
}

