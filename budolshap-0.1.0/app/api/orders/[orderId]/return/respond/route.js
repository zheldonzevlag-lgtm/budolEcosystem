import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { refundFromLocked, releaseFromLocked } from '@/lib/escrow';
import { triggerRealtimeEvent } from '@/lib/realtime';

/**
 * Buyer Response to Return Offer
 * POST /api/orders/[orderId]/return/respond
 */
export async function POST(request, { params }) {
    try {
        const { orderId } = await params;
        const { returnId, action } = await request.json();

        if (!returnId || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        return await prisma.$transaction(async (tx) => {
            const returnRequest = await tx.return.findUnique({
                where: { id: returnId },
                include: { order: true }
            });

            if (!returnRequest || returnRequest.orderId !== orderId) {
                return NextResponse.json({ error: 'Return request not found' }, { status: 404 });
            }

            let newReturnStatus;
            let newOrderStatus;

            if (action === 'ACCEPT') {
                newReturnStatus = 'REFUNDED';
                newOrderStatus = 'REFUNDED';

                // Process partial refund
                await refundFromLocked({
                    orderId,
                    amount: returnRequest.refundAmount
                });

                // Release remaining locked funds back to seller (if any)
                // This is a bit complex since we don't track original locked amount in the return record easily
                // But usually for partial refunds, we refund the partial and release the rest.
                // For now, let's assume the refundFromLocked handles the specific amount.
            } else if (action === 'REJECT') {
                newReturnStatus = 'DISPUTED';
                newOrderStatus = 'RETURN_DISPUTED';
            } else {
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
            }

            const updatedReturn = await tx.return.update({
                where: { id: returnId },
                data: {
                    status: newReturnStatus,
                    updatedAt: new Date()
                }
            });

            await tx.order.update({
                where: { id: orderId },
                data: { status: newOrderStatus }
            });

            // Notify Seller
            await triggerRealtimeEvent(`store-${returnRequest.order.storeId}`, 'return-updated', {
                orderId,
                status: newReturnStatus,
                action: `BUYER_${action}`
            });

            // Notify Buyer (Self) to refresh the page
            await triggerRealtimeEvent(`user-${returnRequest.order.userId}`, 'order-updated', {
                orderId,
                status: newOrderStatus
            });

            return NextResponse.json(updatedReturn);
        });
    } catch (error) {
        console.error('[Buyer Return Respond Error]:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
