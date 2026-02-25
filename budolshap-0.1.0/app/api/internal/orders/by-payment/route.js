import { NextResponse } from 'next/server';
import { findOrderByPaymentIntent } from '@/lib/services/ordersService';

/**
 * Internal Orders API - Find by Payment Intent
 * GET /api/internal/orders/by-payment?paymentIntentId=xxx
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const paymentIntentId = searchParams.get('paymentIntentId');

        if (!paymentIntentId) {
            return NextResponse.json(
                { error: 'paymentIntentId is required' },
                { status: 400 }
            );
        }

        const order = await findOrderByPaymentIntent(paymentIntentId);
        
        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(order);
    } catch (error) {
        console.error('[Internal Orders] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to find order' },
            { status: 500 }
        );
    }
}




