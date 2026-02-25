import { NextResponse } from 'next/server';
import { getPaymentStatus } from '@/lib/services/paymentService';

/**
 * Internal Payment Status API
 * GET /api/internal/payment/status?paymentIntentId=xxx
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

        const status = await getPaymentStatus(paymentIntentId);
        return NextResponse.json(status);
    } catch (error) {
        console.error('[Internal Payment] Status error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}




