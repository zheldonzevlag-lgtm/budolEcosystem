import { NextResponse } from 'next/server';
import { cancelShipping } from '@/lib/services/shippingService';

/**
 * Public Shipping Cancel API
 * POST /api/shipping/lalamove/cancel/[orderId]
 * 
 * Phase 5: Uses shipping service layer
 */
export async function POST(request, { params }) {
    try {
        const { orderId } = await params;
        
        // Option 1: Direct service call (current)
        const result = await cancelShipping(orderId);
        return NextResponse.json(result);
        
        // Option 2: Call internal API (for Phase 5 testing)
        // Uncomment to test internal API calls:
        // const { callInternalServiceJson } = await import('@/lib/api/serviceClient');
        // const result = await callInternalServiceJson('shipping', `/cancel/${orderId}`, {
        //     method: 'POST'
        // });
        // return NextResponse.json(result);
    } catch (error) {
        console.error('Lalamove cancellation error:', error);
        
        // Handle specific Lalamove errors
        if (error.response?.data) {
            const lalamoveError = error.response.data;
            
            if (error.response.status === 400 || error.response.status === 409) {
                return NextResponse.json(
                    {
                        error: 'Cannot cancel order',
                        message: lalamoveError.message || 'Order is outside cancellation window or already in progress',
                        details: lalamoveError
                    },
                    { status: 400 }
                );
            }
            
            return NextResponse.json(
                {
                    error: 'Failed to cancel order',
                    message: lalamoveError.message || 'Unknown error from Lalamove',
                    details: lalamoveError
                },
                { status: error.response.status || 500 }
            );
        }
        
        return NextResponse.json(
            {
                error: error.message || 'Failed to cancel delivery',
                message: error.message
            },
            { status: 500 }
        );
    }
}
