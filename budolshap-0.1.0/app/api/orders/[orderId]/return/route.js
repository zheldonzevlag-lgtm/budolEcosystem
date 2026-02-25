import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { createReturnRequest, getReturnByOrderId } from '@/lib/services/returnsService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/orders/[orderId]/return
 * Fetch return details for an order
 */
export async function GET(request, { params }) {
    try {
        const { orderId } = await params;
        const decoded = getUserFromRequest(request);

        if (!decoded || !decoded.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const returnData = await getReturnByOrderId(orderId);
        return NextResponse.json(returnData);
    } catch (error) {
        console.error('Error fetching return:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch return details' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/orders/[orderId]/return
 * Submit a return/refund request
 */
export async function POST(request, { params }) {
    try {
        const { orderId } = await params;
        const decoded = getUserFromRequest(request);

        if (!decoded || !decoded.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { reason, type, refundAmount, images } = body;

        const returnRequest = await createReturnRequest({
            orderId,
            userId: decoded.userId,
            reason,
            type,
            refundAmount,
            images
        });

        return NextResponse.json(returnRequest);
    } catch (error) {
        console.error('Return request error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to submit return request' },
            { status: 500 }
        );
    }
}
