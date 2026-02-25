import { NextResponse } from 'next/server';
import { initiatePayment, linkPaymentToOrder } from '@/lib/services/paymentService';

/**
 * Internal Payment Checkout API
 * POST /api/internal/payment/checkout
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { amount, method, provider, billing, description, orderId, successUrl, cancelUrl } = body;

        if (!amount || !method) {
            return NextResponse.json(
                { error: 'Amount and payment method are required' },
                { status: 400 }
            );
        }

        // Initiate payment
        const result = await initiatePayment({
            amount,
            currency: 'PHP',
            method,
            provider: provider || 'paymongo',
            billing,
            options: {
                description,
                successUrl,
                cancelUrl
            }
        });

        // Link payment to order if orderId provided
        if (orderId && result.paymentIntentId) {
            try {
                await linkPaymentToOrder(orderId, result.paymentIntentId);
            } catch (linkError) {
                console.error('[Internal Payment] Failed to link order:', linkError);
                // Don't fail the request, payment was initiated successfully
            }
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('[Internal Payment] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}




