import { NextResponse } from 'next/server';
import { getShippingQuote } from '@/lib/services/shippingService';

/**
 * Internal Shipping Quote API
 * POST /api/internal/shipping/quote
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const result = await getShippingQuote(body);
        return NextResponse.json(result);
    } catch (error) {
        console.error('[Internal Shipping] Quote error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get shipping quote' },
            { status: 500 }
        );
    }
}




