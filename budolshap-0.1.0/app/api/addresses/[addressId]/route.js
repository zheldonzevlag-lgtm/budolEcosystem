import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET single address
export async function GET(request, { params }) {
    try {
        const { addressId } = await params

        const address = await prisma.address.findUnique({
            where: { id: addressId }
        })

        if (!address) {
            return NextResponse.json(
                { error: 'Address not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(address)
    } catch (error) {
        console.error('Error fetching address:', error)
        return NextResponse.json(
            { error: 'Failed to fetch address' },
            { status: 500 }
        )
    }
}

// PUT update address
export async function PUT(request, { params }) {
    try {
        const { addressId } = await params
        const body = await request.json()

        // Clean phone number if present
        const cleanPhone = body.phone ? body.phone.replace(/[\s-]/g, '') : undefined

        // Check if address exists
        const existingAddress = await prisma.address.findUnique({
            where: { id: addressId }
        })

        if (!existingAddress) {
            return NextResponse.json(
                { error: 'Address not found' },
                { status: 404 }
            )
        }

        // If setting as default, unset other default addresses
        if (body.isDefault && !existingAddress.isDefault) {
            // Use raw SQL to bypass stale client
            await prisma.$executeRaw`UPDATE "Address" SET "isDefault" = false WHERE "userId" = ${existingAddress.userId} AND "isDefault" = true AND "id" != ${addressId}`;
        }

        const address = await prisma.address.update({
            where: { id: addressId },
            data: {
                ...(body.name && { name: body.name }),
                ...(body.email && { email: body.email }),
                ...(body.street && { street: body.street }),
                ...(body.city && { city: body.city }),
                ...(body.state && { state: body.state }),
                ...(body.zip !== undefined && { zip: body.zip }),
                ...(body.country && { country: body.country }),
                ...(cleanPhone && { phone: cleanPhone }),
                ...(body.latitude !== undefined && { latitude: body.latitude }),
                ...(body.longitude !== undefined && { longitude: body.longitude }),
                // New fields
                ...(body.houseNumber !== undefined && { houseNumber: body.houseNumber }),
                ...(body.barangay !== undefined && { barangay: body.barangay }),
                ...(body.subdivision !== undefined && { subdivision: body.subdivision }),
                ...(body.landmark !== undefined && { landmark: body.landmark }),
                ...(body.buildingName !== undefined && { buildingName: body.buildingName }),
                ...(body.floorUnit !== undefined && { floorUnit: body.floorUnit }),
                ...(body.notes !== undefined && { notes: body.notes }),
                ...(body.label !== undefined && { label: body.label })
            }
        })

        // Set isDefault via raw SQL if necessary
        if (body.isDefault !== undefined) {
            await prisma.$executeRaw`UPDATE "Address" SET "isDefault" = ${body.isDefault} WHERE "id" = ${addressId}`;
        }

        return NextResponse.json(address)
    } catch (error) {
        console.error('Error updating address:', error)
        return NextResponse.json(
            { error: 'Failed to update address' },
            { status: 500 }
        )
    }
}

// PATCH update address coordinates (for geocoding cache)
export async function PATCH(request, { params }) {
    try {
        const { addressId } = await params
        const body = await request.json()
        const { latitude, longitude } = body

        // Validate coordinates
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            return NextResponse.json(
                { error: 'Invalid coordinates. Latitude and longitude must be numbers.' },
                { status: 400 }
            )
        }

        // Validate coordinate ranges
        if (latitude < -90 || latitude > 90) {
            return NextResponse.json(
                { error: 'Invalid latitude. Must be between -90 and 90.' },
                { status: 400 }
            )
        }

        if (longitude < -180 || longitude > 180) {
            return NextResponse.json(
                { error: 'Invalid longitude. Must be between -180 and 180.' },
                { status: 400 }
            )
        }

        // Update coordinates
        const address = await prisma.address.update({
            where: { id: addressId },
            data: {
                latitude,
                longitude,
                updatedAt: new Date()
            }
        })

        console.log(`[Geocoding Cache] Updated coordinates for address ${addressId}:`, {
            latitude,
            longitude
        })

        return NextResponse.json({
            success: true,
            address
        })
    } catch (error) {
        console.error('Error updating address coordinates:', error)
        return NextResponse.json(
            { error: 'Failed to update address coordinates' },
            { status: 500 }
        )
    }
}

// DELETE address
export async function DELETE(request, { params }) {
    try {
        const { addressId } = await params

        await prisma.address.delete({
            where: { id: addressId }
        })

        return NextResponse.json({ message: 'Address deleted successfully' })
    } catch (error) {
        console.error('Error deleting address:', error)
        return NextResponse.json(
            { error: 'Failed to delete address' },
            { status: 500 }
        )
    }
}

