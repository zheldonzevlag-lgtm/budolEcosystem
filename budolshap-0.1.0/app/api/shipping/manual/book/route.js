import { NextResponse } from 'next/server';
import { bookShipping } from '@/lib/services/shippingService';

/**
 * Public Manual Shipping Book API
 * POST /api/shipping/manual/book
 * 
 * Phase 5: Uses shipping service layer
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { orderId, provider, trackingNumber, trackingUrl } = body;
        
        // Option 1: Direct service call (current)
        const result = await bookShipping({
            orderId,
            provider: provider || 'manual',
            trackingNumber,
            trackingUrl
        });
        return NextResponse.json(result);
        
        // Option 2: Call internal API (for Phase 5 testing)
        // Uncomment to test internal API calls:
        // const { callInternalServiceJson } = await import('@/lib/api/serviceClient');
        // const result = await callInternalServiceJson('shipping', '/book', {
        //     method: 'POST',
        //     body: JSON.stringify({ ...body, provider: 'manual' })
        // });
        // return NextResponse.json(result);
    } catch (error) {
        console.error('Manual booking error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update shipping' },
            { status: 500 }
        );
    }
}
