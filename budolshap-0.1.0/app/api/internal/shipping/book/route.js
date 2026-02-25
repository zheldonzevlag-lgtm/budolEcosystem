import { NextResponse } from 'next/server';
import { bookShipping } from '@/lib/services/shippingService';

/**
 * Internal Shipping Book API
 * POST /api/internal/shipping/book
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const result = await bookShipping(body);
        return NextResponse.json(result);
    } catch (error) {
        console.error('[Internal Shipping] Book error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to book shipping' },
            { status: 500 }
        );
    }
}




