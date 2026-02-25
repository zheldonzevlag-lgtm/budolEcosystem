import { NextResponse } from 'next/server';
import { cancelShipping } from '@/lib/services/shippingService';

/**
 * Internal Shipping Cancel API
 * POST /api/internal/shipping/cancel/[orderId]
 */
export async function POST(request, { params }) {
    try {
        const { orderId } = await params;
        const result = await cancelShipping(orderId);
        return NextResponse.json(result);
    } catch (error) {
        console.error('[Internal Shipping] Cancel error:', error);
        if (error.message === 'Order not found') {
            return NextResponse.json(
                { error: error.message },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { error: error.message || 'Failed to cancel shipping' },
            { status: 500 }
        );
    }
}




