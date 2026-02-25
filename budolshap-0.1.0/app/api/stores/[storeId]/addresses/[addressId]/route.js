import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/stores/[storeId]/addresses/[addressId] - Get a specific address
export async function GET(request, { params }) {
    try {
        const { storeId, addressId } = await params

        const address = await prisma.storeAddress.findFirst({
            where: {
                id: addressId,
                storeId
            }
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

// PUT /api/stores/[storeId]/addresses/[addressId] - Update an address
export async function PUT(request, { params }) {
    try {
        const { storeId, addressId } = await params
        const body = await request.json()

        const {
            phone, district, province, city, barangay,
            detailedAddress, zip, country, notes, label, isDefault,
            latitude, longitude
        } = body

        // Check if address exists
        const existingAddress = await prisma.storeAddress.findFirst({
            where: {
                id: addressId,
                storeId
            }
        })

        if (!existingAddress) {
            return NextResponse.json(
                { error: 'Address not found' },
                { status: 404 }
            )
        }

        const baseUpdateData = {
            phone,
            district,
            province: province || null,
            city,
            barangay: barangay || null,
            detailedAddress,
            zip,
            country: country || 'Philippines',
            notes: notes || null,
            label: label || null,
            latitude: latitude !== undefined ? (latitude ? parseFloat(latitude) : null) : existingAddress.latitude,
            longitude: longitude !== undefined ? (longitude ? parseFloat(longitude) : null) : existingAddress.longitude
        }

        let updatedAddress
        if (isDefault === true && !existingAddress.isDefault) {
            updatedAddress = await prisma.$transaction(async (tx) => {
                await tx.storeAddress.updateMany({
                    where: {
                        storeId,
                        isDefault: true,
                        id: { not: addressId }
                    },
                    data: { isDefault: false }
                })
                return tx.storeAddress.update({
                    where: { id: addressId },
                    data: { ...baseUpdateData, isDefault: true }
                })
            })
        } else {
            updatedAddress = await prisma.storeAddress.update({
                where: { id: addressId },
                data: { ...baseUpdateData }
            })
        }

        return NextResponse.json(updatedAddress)
    } catch (error) {
        console.error('Error updating address:', error)
        return NextResponse.json(
            { error: 'Failed to update address' },
            { status: 500 }
        )
    }
}

// DELETE /api/stores/[storeId]/addresses/[addressId] - Delete an address
export async function DELETE(request, { params }) {
    try {
        const { storeId, addressId } = await params

        // Check if address exists
        const address = await prisma.storeAddress.findFirst({
            where: {
                id: addressId,
                storeId
            }
        })

        if (!address) {
            return NextResponse.json(
                { error: 'Address not found' },
                { status: 404 }
            )
        }

        // If deleting the default address, set another address as default
        if (address.isDefault) {
            const otherAddress = await prisma.storeAddress.findFirst({
                where: {
                    storeId,
                    id: { not: addressId }
                }
            })

            if (otherAddress) {
                await prisma.storeAddress.update({
                    where: { id: otherAddress.id },
                    data: { isDefault: true }
                })
            }
        }

        // Delete the address
        await prisma.storeAddress.delete({
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
