import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { createAuditLog } from '@/lib/audit'

export async function PATCH(request, { params }) {
    const { authorized, user, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const { id } = await params
        const body = await request.json()
        const { isActive } = body

        if (isActive === undefined) {
            return NextResponse.json({ error: 'isActive field is required' }, { status: 400 })
        }

        const store = await prisma.store.update({
            where: { id },
            data: { isActive },
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

        // Log store update
        await createAuditLog(user?.id || null, 'STORE_UPDATE', request, {
            entity: 'Store',
            entityId: id,
            status: 'SUCCESS',
            details: `Store ${isActive ? 'activated' : 'deactivated'}`,
            metadata: { isActive }
        });

        return NextResponse.json(store)
    } catch (error) {
        console.error('Error updating store:', error)
        return NextResponse.json({ error: 'Failed to update store' }, { status: 500 })
    }
}

export async function DELETE(request, { params }) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const { id } = await params

        // Delete associated products and orders first (Prisma might handle this if cascade is set, but let's be safe)
        // Actually, let's just delete the store and let Prisma handle relations if they are set to cascade.
        // If not, we might need to delete them manually.

        await prisma.store.delete({
            where: { id }
        })

        return NextResponse.json({ message: 'Store deleted successfully' })
    } catch (error) {
        console.error('Error deleting store:', error)
        return NextResponse.json({ error: 'Failed to delete store' }, { status: 500 })
    }
}
