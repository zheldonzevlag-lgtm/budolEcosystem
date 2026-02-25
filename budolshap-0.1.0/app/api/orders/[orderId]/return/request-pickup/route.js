import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerRealtimeEvent } from '@/lib/realtime';
import { getUserFromRequest } from '@/lib/auth';

/**
 * Buyer Requests Return Pickup
 * POST /api/orders/[orderId]/return/request-pickup
 */
export async function POST(request, { params }) {
    try {
        const { orderId } = await params;
        const { returnId } = await request.json();
        const decoded = getUserFromRequest(request);

        if (!decoded || !decoded.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!returnId) {
            return NextResponse.json({ error: 'Missing returnId' }, { status: 400 });
        }

        const returnRequest = await prisma.return.findUnique({
            where: { id: returnId },
            include: { order: true }
        });

        if (!returnRequest || returnRequest.orderId !== orderId) {
            return NextResponse.json({ error: 'Return request not found' }, { status: 404 });
        }

        if (returnRequest.order.userId !== decoded.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        if (returnRequest.status !== 'APPROVED') {
            return NextResponse.json({ error: 'Return must be APPROVED before requesting pickup' }, { status: 400 });
        }

        const updatedReturn = await prisma.return.update({
            where: { id: returnId },
            data: {
                status: 'BOOKING_REQUESTED',
                updatedAt: new Date()
            }
        });

        // Notify Seller
        await triggerRealtimeEvent(`store-${returnRequest.order.storeId}`, 'return-updated', {
            orderId,
            returnId,
            status: 'BOOKING_REQUESTED',
            action: 'BUYER_REQUEST_PICKUP'
        });

        // Notify Buyer (Self)
        await triggerRealtimeEvent(`user-${decoded.userId}`, 'order-updated', {
            orderId,
            status: returnRequest.order.status // Keep order status same, but UI will react to return status
        });

        return NextResponse.json(updatedReturn);
    } catch (error) {
        console.error('[Request Pickup Error]:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
