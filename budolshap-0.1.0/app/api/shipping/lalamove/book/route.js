import { NextResponse } from 'next/server';
import { bookShipping } from '@/lib/services/shippingService';

/**
 * Public Shipping Book API
 * POST /api/shipping/lalamove/book
 * 
 * Phase 5: Uses shipping service layer
 * Note: Full implementation with phone formatting, quote refresh, etc. 
 * is handled in the service layer
 */
export async function POST(request) {
    try {
        let body;
        try {
            body = await request.json();
        } catch (jsonError) {
            console.error('[Lalamove Book] Invalid JSON in request:', jsonError);
            return NextResponse.json(
                {
                    error: 'Invalid request body',
                    message: 'Request body must be valid JSON'
                },
                { status: 400 }
            );
        }
        
        if (!body || !body.orderId) {
            return NextResponse.json(
                {
                    error: 'Missing orderId',
                    message: 'orderId is required in request body'
                },
                { status: 400 }
            );
        }
        
        // Option 1: Direct service call (current)
        const result = await bookShipping({
            ...body,
            provider: 'lalamove'
        });
        return NextResponse.json(result);
        
        // Option 2: Call internal API (for Phase 5 testing)
        // Uncomment to test internal API calls:
        // const { callInternalServiceJson } = await import('@/lib/api/serviceClient');
        // const result = await callInternalServiceJson('shipping', '/book', {
        //     method: 'POST',
        //     body: JSON.stringify({ ...body, provider: 'lalamove' })
        // });
        // return NextResponse.json(result);
    } catch (error) {
        console.error('[Lalamove Book Error]:', error);
        console.error('[Lalamove Book Error Details]:', {
            name: error?.name,
            message: error?.message,
            stack: error?.stack,
            code: error?.code,
            originalError: error?.originalError
        });
        
        // Safely extract error message
        const errorMessage = error?.message || error?.toString() || 'Failed to book shipping';
        
        // Handle custom service errors
        if (error?.code) {
            return NextResponse.json(
                {
                    error: 'Failed to create booking',
                    message: errorMessage,
                    code: error.code,
                    details: error.originalError || errorMessage
                },
                { status: 400 }
            );
        }
        
        return NextResponse.json(
            {
                error: errorMessage,
                message: errorMessage,
                details: error?.originalError || errorMessage
            },
            { status: 500 }
        );
    }
}
