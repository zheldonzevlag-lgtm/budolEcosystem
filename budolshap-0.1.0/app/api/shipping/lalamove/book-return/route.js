import { NextResponse } from 'next/server';
import { bookReturnShipping } from '@/lib/services/shippingService';

/**
 * Return Shipping Book API
 * POST /api/shipping/lalamove/book-return
 * 
 * Handles the "Return Leg" of a Return & Refund request.
 * Swaps addresses (Buyer -> Seller) and creates a new Lalamove booking.
 */
export async function POST(request) {
    try {
        const body = await request.json();
        
        if (!body || !body.orderId || !body.returnId) {
            return NextResponse.json(
                {
                    error: 'Missing required fields',
                    message: 'orderId and returnId are required'
                },
                { status: 400 }
            );
        }
        
        const result = await bookReturnShipping({
            orderId: body.orderId,
            returnId: body.returnId,
            provider: body.provider || 'lalamove',
            serviceType: body.serviceType || 'MOTORCYCLE'
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('[Return Book Error]:', error);
        return NextResponse.json(
            {
                error: 'Failed to book return shipping',
                message: error?.message || 'Internal Server Error'
            },
            { status: 500 }
        );
    }
}
