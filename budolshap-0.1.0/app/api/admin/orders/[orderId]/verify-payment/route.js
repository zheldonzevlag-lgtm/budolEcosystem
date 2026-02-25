import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import { triggerRealtimeEvent } from '@/lib/realtime';

export async function POST(request, { params }) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const { orderId } = await params;
        const body = await request.json();
        const { action, notes } = body; // action: 'approve' | 'reject'

        if (!['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // 2. Process verification within a transaction
        const result = await prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: { paymentProof: true }
            });

            if (!order) throw new Error('Order not found');
            if (order.status !== 'PENDING_VERIFICATION') {
                throw new Error('Order is not pending verification');
            }

            const newStatus = action === 'approve' ? 'PAID' : 'ORDER_PLACED';
            const isPaid = action === 'approve';
            const proofStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: {
                    status: newStatus,
                    isPaid: isPaid
                }
            });

            const updatedProof = await tx.paymentProof.update({
                where: { orderId },
                data: {
                    status: proofStatus,
                    notes: notes || order.paymentProof?.notes
                }
            });

            return { updatedOrder, updatedProof };
        });

        // 3. Trigger real-time updates for buyer and store
        try {
            // Notify buyer
            await triggerRealtimeEvent(`user-${result.updatedOrder.userId}`, 'order-updated', {
                orderId: result.updatedOrder.id,
                status: result.updatedOrder.status,
                message: action === 'approve' ? 'Your payment has been verified!' : 'Your payment proof was rejected. Please try again.'
            });

            // Notify store
            await triggerRealtimeEvent(`store-${result.updatedOrder.storeId}`, 'order-updated', {
                orderId: result.updatedOrder.id,
                status: result.updatedOrder.status
            });
        } catch (realtimeError) {
            console.error('Failed to trigger realtime event:', realtimeError);
        }

        return NextResponse.json({
            success: true,
            status: result.updatedOrder.status,
            isPaid: result.updatedOrder.isPaid
        });

    } catch (error) {
        console.error('Admin verification error:', error);
        return NextResponse.json(
            { error: 'Failed to process verification', message: error.message },
            { status: 500 }
        );
    }
}
