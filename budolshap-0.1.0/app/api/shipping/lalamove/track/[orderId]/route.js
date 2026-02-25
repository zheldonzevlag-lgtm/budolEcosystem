import { NextResponse } from 'next/server';
import { trackShipping } from '@/lib/services/shippingService';

/**
 * Public Shipping Track API
 * GET /api/shipping/lalamove/track/[orderId]
 * 
 * Phase 5: Uses shipping service layer
 */
export async function GET(request, { params }) {
    try {
        const { orderId } = await params;
        
        // Option 1: Direct service call (current)
        const result = await trackShipping(orderId);
        return NextResponse.json(result);
        
        // Option 2: Call internal API (for Phase 5 testing)
        // Uncomment to test internal API calls:
        // const { callInternalServiceJson } = await import('@/lib/api/serviceClient');
        // const result = await callInternalServiceJson('shipping', `/track/${orderId}`);
        // return NextResponse.json(result);
    } catch (error) {
        console.error('Lalamove tracking error:', error);
        
        // Handle specific Lalamove errors
        if (error.response?.data) {
            const lalamoveError = error.response.data;
            return NextResponse.json(
                {
                    error: 'Failed to track order',
                    message: lalamoveError.message || 'Unknown error from Lalamove',
                    details: lalamoveError
                },
                { status: error.response.status || 500 }
            );
        }
        
        return NextResponse.json(
            {
                error: error.message || 'Failed to track delivery',
                message: error.message
            },
            { status: 500 }
        );
    }
}
