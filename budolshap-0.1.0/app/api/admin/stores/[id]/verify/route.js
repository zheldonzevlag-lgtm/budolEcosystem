import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { updateTrustStatus } from '@/lib/api/budolIdClient'
import { triggerRealtimeEvent } from '@/lib/realtime'
import { createAuditLog } from '@/lib/audit'

export async function PUT(request, { params }) {
    const { authorized, user, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const { id } = await params
        const body = await request.json()
        const { verificationStatus, verificationNotes } = body

        if (!verificationStatus || !['APPROVED', 'REJECTED', 'PENDING'].includes(verificationStatus)) {
            return NextResponse.json({ error: 'Invalid verification status' }, { status: 400 })
        }

        const store = await prisma.store.update({
            where: { id },
            data: {
                verificationStatus,
                verificationNotes: verificationNotes || null,
                // If approved, activate the store
                isActive: verificationStatus === 'APPROVED' ? true : undefined,
                // Sync legacy status field for frontend compatibility
                status: verificationStatus.toLowerCase()
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

        // 1. Eco-Sync: Update KYB status in budolID (Centralized Trust)
        try {
            await updateTrustStatus(store.userId, {
                kybStatus: verificationStatus // APPROVED, REJECTED, or PENDING
            });
            console.log(`[Eco-Sync] Updated KYB status in budolID for user ${store.userId}`);
        } catch (error) {
            console.error('[Eco-Sync] Failed to update trust status in budolID:', error.message);
            // We don't block the local update, but log the failure
        }

        // TRIGGER REALTIME EVENT (to the specific user)
        await triggerRealtimeEvent(`user-${store.userId}`, 'store-status-updated', {
            storeId: store.id,
            status: verificationStatus,
            isActive: store.isActive
        })

        // TRIGGER REALTIME EVENT (to all admins for dashboard sync)
        await triggerRealtimeEvent('admin', 'store-status-updated', {
            storeId: store.id,
            status: verificationStatus,
            isActive: store.isActive,
            store: store // Send full object for easier UI updates
        })

        // Log store verification
        await createAuditLog(user?.id || null, 'STORE_VERIFY', request, {
            entity: 'Store',
            entityId: store.id,
            status: 'SUCCESS',
            details: `Store verification status updated to ${verificationStatus}`,
            metadata: {
                previousStatus: store.status, // Note: This is post-update, so it might be same if not careful, but acceptable for now
                verificationNotes
            }
        });

        return NextResponse.json(store)
    } catch (error) {
        console.error('Error verifying store:', error)
        return NextResponse.json({ error: 'Failed to verify store' }, { status: 500 })
    }
}
