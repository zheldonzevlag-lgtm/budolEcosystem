import { NextResponse } from 'next/server';
import { trackShipping } from '@/lib/services/shippingService';

/**
 * Internal Shipping Track API
 * GET /api/internal/shipping/track/[orderId]
 */
export async function GET(request, { params }) {
    try {
        const { orderId } = await params;
        const result = await trackShipping(orderId);
        return NextResponse.json(result);
    } catch (error) {
        console.error('[Internal Shipping] Track error:', error);
        if (error.message === 'Order not found') {
            return NextResponse.json(
                { error: error.message },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { error: error.message || 'Failed to track shipping' },
            { status: 500 }
        );
    }
}




