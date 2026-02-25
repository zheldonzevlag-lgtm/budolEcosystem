import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/stores/[storeId]/addresses - Get all addresses for a store
export async function GET(request, { params }) {
    try {
        const { storeId } = await params

        const addresses = await prisma.storeAddress.findMany({
            where: { storeId },
            orderBy: [
                { isDefault: 'desc' }, // Default address first
                { createdAt: 'asc' }
            ]
        })

        return NextResponse.json(addresses)
    } catch (error) {
        console.error('Error fetching store addresses:', error)
        return NextResponse.json(
            { error: 'Failed to fetch addresses' },
            { status: 500 }
        )
    }
}

// POST /api/stores/[storeId]/addresses - Create a new address
export async function POST(request, { params }) {
    try {
        const { storeId } = await params
        const body = await request.json()

        const {
            phone, district, province, city, barangay,
            detailedAddress, zip, country, notes, label, isDefault,
            latitude, longitude
        } = body

        // Validate required fields
        if (!phone || !city || !detailedAddress) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Check if store exists
        const store = await prisma.store.findUnique({
            where: { id: storeId }
        })

        if (!store) {
            return NextResponse.json(
                { error: 'Store not found' },
                { status: 404 }
            )
        }

        // Count existing addresses
        const addressCount = await prisma.storeAddress.count({
            where: { storeId }
        })

        // Limit to 3 addresses
        if (addressCount >= 3) {
            return NextResponse.json(
                { error: 'Maximum of 3 addresses allowed per store' },
                { status: 400 }
            )
        }

        const address = await prisma.$transaction(async (tx) => {
            const shouldBeDefault = addressCount === 0 || !!isDefault

            if (shouldBeDefault) {
                await tx.storeAddress.updateMany({
                    where: { storeId, isDefault: true },
                    data: { isDefault: false }
                })
            }

            const created = await tx.storeAddress.create({
                data: {
                    storeId,
                    phone,
                    district: district || null,
                    province: province || null,
                    city,
                    barangay: barangay || null,
                    detailedAddress,
                    zip,
                    country: country || 'Philippines',
                    notes: notes || null,
                    label: label || null,
                    isDefault: shouldBeDefault,
                    latitude: latitude ? parseFloat(latitude) : null,
                    longitude: longitude ? parseFloat(longitude) : null
                }
            })

            return created
        })

        return NextResponse.json(address, { status: 201 })
    } catch (error) {
        console.error('Error creating store address:', error)
        return NextResponse.json(
            { error: 'Failed to create address' },
            { status: 500 }
        )
    }
}
