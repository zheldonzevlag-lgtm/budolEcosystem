import { NextResponse } from 'next/server';
import { initiatePayment, linkPaymentToOrder, linkPaymentToCheckout } from '@/lib/services/paymentService';
import { createCheckoutSession, getCheckoutSession, updateCheckoutSession, markCheckoutAsPaid, markCheckoutAsFailed } from '@/lib/services/checkoutService';

/**
 * Public Payment Checkout API
 * POST /api/payment/checkout
 * 
 * Phase 3: Can optionally call internal API for consistency
 */
export async function POST(request) {
    let activeCheckoutId = null;
    try {
        const body = await request.json();
        const { amount, method, provider = 'paymongo', billing, description, orderId, orderIds, checkoutId, storeName, createNewSession = false } = body;

        // Handle multiple order IDs if present
        const targetOrderIds = orderIds && Array.isArray(orderIds) && orderIds.length > 0 
            ? orderIds 
            : (orderId ? [orderId] : []);

        activeCheckoutId = checkoutId;

        if (!amount || !method) {
            return NextResponse.json({ error: 'Amount and payment method are required' }, { status: 400 });
        }

        // COD is an immediate payment method that doesn't require payment gateway
        if (method === 'COD' || method === 'cod') {
            return NextResponse.json({
                error: `${method} is an immediate payment method and cannot be processed through payment gateway. Please use a different payment method.`
            }, { status: 400 });
        }

        // --- Dynamic Return URL Logic ---
        const host = request.headers.get('host');
        const protocol = request.headers.get('x-forwarded-proto') || 'https';

        // Priority: 1. Host header (current domain), 2. NEXT_PUBLIC_BASE_URL, 3. VERCEL_URL, 4. Fallback
        let baseUrl = '';

        if (host) {
            baseUrl = `${protocol}://${host}`;
        } else if (process.env.NEXT_PUBLIC_BASE_URL) {
            baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
            if (!baseUrl.startsWith('http')) baseUrl = `https://${baseUrl}`;
        } else if (process.env.VERCEL_URL) {
            baseUrl = `https://${process.env.VERCEL_URL}`;
        } else {
            baseUrl = 'https://budolshap-v3.vercel.app'; // Final fallback
        }

        // Ensure no trailing slash
        baseUrl = baseUrl.replace(/\/$/, '');

        const successUrl = `${baseUrl}/payment/return`;
        const cancelUrl = `${baseUrl}/payment/failed`;

        console.log('🔗 [Unified Checkout] Return URL:', successUrl);

        // --- Enhanced Checkout Session Management (Phase 2) ---
        
        // Create new checkout session if requested or if no existing session
        if (createNewSession || !activeCheckoutId) {
            try {
                const checkoutSession = await createCheckoutSession({
                    userId: billing?.customerId || 'anonymous',
                    total: amount,
                    currency: 'PHP',
                    metadata: {
                        orderIds: targetOrderIds,
                        paymentMethod: method,
                        provider,
                        storeName,
                        description
                    }
                });
                
                activeCheckoutId = checkoutSession.id;
                console.log(`✅ [Unified Checkout] Created new session: ${activeCheckoutId}`);
            } catch (sessionError) {
                console.error('❌ [Unified Checkout] Failed to create checkout session:', sessionError);
                // Continue with existing logic if session creation fails
            }
        }

        // Validate existing checkout session
        if (activeCheckoutId && !createNewSession) {
            try {
                const existingSession = await getCheckoutSession(activeCheckoutId);
                if (!existingSession) {
                    console.warn(`⚠️ [Unified Checkout] Session ${activeCheckoutId} not found or expired`);
                    activeCheckoutId = null;
                }
            } catch (validationError) {
                console.error('❌ [Unified Checkout] Session validation error:', validationError);
                activeCheckoutId = null;
            }
        }

        // Option 1: Direct service call (current)
        const result = await initiatePayment({
            amount,
            currency: 'PHP',
            method,
            provider,
            billing,
            options: {
                description,
                successUrl,
                cancelUrl,
                orderId, // Pass orderId here for gateway metadata
                orderIds, // Pass orderIds here for gateway metadata
                checkoutId, // Pass checkoutId here for gateway metadata
                storeName
            }
        });

        // Option 2: Call internal API (for Phase 3 testing)
        // Uncomment to test internal API calls:
        // const { callInternalServiceJson } = await import('@/lib/api/serviceClient');
        // const result = await callInternalServiceJson('payment', '/checkout', {
        //     method: 'POST',
        //     body: JSON.stringify({
        //         amount,
        //         method,
        //         provider,
        //         billing,
        //         description,
        //         successUrl,
        //         cancelUrl
        //     })
        // });

        // --- Update Order with LINKING ID (Critical for Webhooks) ---
        if (result.paymentIntentId) {
            // Link to Master Checkout (Phase 2 Multi-Store Support)
            if (activeCheckoutId) {
                try {
                    await linkPaymentToCheckout(activeCheckoutId, result.paymentIntentId, provider);
                    
                    // Update checkout session status
                    try {
                        await markCheckoutAsPaid(activeCheckoutId, result.paymentIntentId, provider);
                        console.log(`✅ [Unified Checkout] Marked session ${activeCheckoutId} as PAID`);
                    } catch (statusError) {
                        console.error('⚠️ [Unified Checkout] Failed to update session status:', statusError);
                    }
                    
                    console.log(`🔗 [Unified Checkout] Linked Checkout ${activeCheckoutId} to Intent ${result.paymentIntentId}`);
                } catch (dbError) {
                    console.error('⚠️ [Unified Checkout] Failed to link payment to checkout:', dbError);
                    // Non-fatal, continue to link orders
                }
            }

            // Handle multiple order IDs if present
            if (targetOrderIds.length > 0) {
                console.log(`🔗 [Unified Checkout] Linking Payment Intent ${result.paymentIntentId} to Orders:`, targetOrderIds);
                
                // Link all orders concurrently
                await Promise.allSettled(targetOrderIds.map(async (id) => {
                    try {
                        await linkPaymentToOrder(id, result.paymentIntentId);
                        console.log(`✅ [Unified Checkout] Linked Order ${id} to Intent ${result.paymentIntentId}`);
                    } catch (dbError) {
                        console.error(`⚠️ [Unified Checkout] Failed to link Order ${id} to Payment Intent:`, dbError);
                    }
                }));
            }
        }

        console.log('📤 [Unified Checkout] Returning to frontend:', JSON.stringify(result, null, 2));
        return NextResponse.json(result);

    } catch (error) {
        console.error('[Unified Checkout Error]:', error);
        
        // Update checkout session status if it exists
        if (activeCheckoutId) {
            try {
                await markCheckoutAsFailed(activeCheckoutId, error.message || 'Payment initiation failed');
                console.log(`❌ [Unified Checkout] Marked session ${activeCheckoutId} as FAILED`);
            } catch (statusError) {
                console.error('⚠️ [Unified Checkout] Failed to update session status on error:', statusError);
            }
        }
        
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
