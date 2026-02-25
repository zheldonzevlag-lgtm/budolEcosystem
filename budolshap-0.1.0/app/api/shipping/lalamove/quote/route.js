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

        // Log detailed error from Lalamove if available
        const originalError = error.originalError || null;
        if (originalError) {
            console.error('[Lalamove Quote Original Error]:', JSON.stringify(originalError, null, 2));
        }

        // Ensure error details are serializable and not empty
        const errorDetails = originalError ? 
            (originalError instanceof Error ? { message: originalError.message, stack: originalError.stack } : originalError) : 
            { message: error.message };

        return NextResponse.json({
            error: error.message || 'Failed to get shipping quote',
            details: errorDetails,
            code: error.code || 'UNKNOWN',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
