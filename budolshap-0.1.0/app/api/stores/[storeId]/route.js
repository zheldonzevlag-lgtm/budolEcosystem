import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { triggerRealtimeEvent } from '@/lib/realtime'

// GET single store
export async function GET(request, { params }) {
    try {
        const { storeId } = await params

        const store = await prisma.store.findUnique({
            where: { id: storeId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                },
                Product: {
                    where: {
                        inStock: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                _count: {
                    select: {
                        Product: true,
                        Order: true
                    }
                },
                addresses: {
                    where: {
                        isDefault: true
                    },
                    take: 1
                }
            }
        })

        if (!store) {
            return NextResponse.json(
                { error: 'Store not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(store)
    } catch (error) {
        console.error('Error fetching store:', error)
        return NextResponse.json(
            { error: 'Failed to fetch store' },
            { status: 500 }
        )
    }
}

// PUT update store
export async function PUT(request, { params }) {
    try {
        const { storeId } = await params
        const body = await request.json()

        const store = await prisma.store.update({
            where: { id: storeId },
            data: {
                ...(body.name && { name: body.name }),
                ...(body.description && { description: body.description }),
                ...(body.email && { email: body.email }),
                ...(body.contact && { contact: body.contact }),
                ...(body.address && { address: body.address }),
                ...(body.logo && { logo: body.logo }),
                ...(body.status && { status: body.status }),
                ...(body.isActive !== undefined && { isActive: body.isActive }),
                ...(body.latitude !== undefined && { latitude: body.latitude ? parseFloat(body.latitude) : null }),
                ...(body.longitude !== undefined && { longitude: body.longitude ? parseFloat(body.longitude) : null })
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                }
            }
        })

        // Broadcast realtime update
        await triggerRealtimeEvent('admin-notifications', 'store-updated', store);
        await triggerRealtimeEvent(`user-${store.userId}`, 'store-updated', store);

        return NextResponse.json(store)
    } catch (error) {
        console.error('Error updating store:', error)
        return NextResponse.json(
            { error: 'Failed to update store' },
            { status: 500 }
        )
    }
}

// DELETE store (admin only)
export async function DELETE(request, { params }) {
    try {
        const { storeId } = await params

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

        // Delete store (cascade will delete related products and orders)
        await prisma.store.delete({
            where: { id: storeId }
        })

        return NextResponse.json({ message: 'Store deleted successfully' })
    } catch (error) {
        console.error('Error deleting store:', error)
        return NextResponse.json(
            { error: 'Failed to delete store' },
            { status: 500 }
        )
    }
}

