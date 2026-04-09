import { NextResponse } from 'next/server';
import { getShippingQuote } from '@/lib/services/shippingService';

/**
 * Public Shipping Quote API
 * POST /api/shipping/lalamove/quote
 * 
 * Phase 5: Uses shipping service layer
 */
export async function POST(request) {
    console.log('[Lalamove Quote] Request received');

    try {
        const body = await request.json();

        // Option 1: Direct service call (current)
        const result = await getShippingQuote({
            ...body,
            provider: 'lalamove'
        });
        return NextResponse.json(result);

        // Option 2: Call internal API (for Phase 5 testing)
        // Uncomment to test internal API calls:
        // const { callInternalServiceJson } = await import('@/lib/api/serviceClient');
        // const result = await callInternalServiceJson('shipping', '/quote', {
        //     method: 'POST',
        //     body: JSON.stringify({ ...body, provider: 'lalamove' })
        // });
        // return NextResponse.json(result);
    } catch (error) {
        console.error('[Lalamove Quote Error]:', error);

        const upstreamStatus = error?.response?.status || null;
        const originalError = error?.originalError ?? error?.response?.data ?? null;
        const status = (typeof upstreamStatus === 'number' && upstreamStatus >= 400 && upstreamStatus < 600)
            ? upstreamStatus
            : (error?.code === 'LALAMOVE_SERVER_ERROR' ? 503 : 500);

        let details = null;
        if (typeof originalError === 'string') {
            details = { raw: originalError };
        } else if (originalError instanceof Error) {
            details = { message: originalError.message };
        } else if (originalError && typeof originalError === 'object') {
            details = originalError;
        } else {
            details = { message: error?.message || 'Failed to get shipping quote' };
        }

        return NextResponse.json({
            error: error?.message || 'Failed to get shipping quote',
            details,
            code: error?.code || 'UNKNOWN',
            status,
            timestamp: new Date().toISOString()
        }, { status });
    }
}
