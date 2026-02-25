import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { amount, description, billing } = body;

        if (!amount) {
            return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
        }

        const authHeader = `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64')}`;
        const headers = {
            accept: 'application/json',
            'content-type': 'application/json',
            authorization: authHeader
        };

        // 1. Create Payment Intent
        const intentResponse = await fetch('https://api.paymongo.com/v1/payment_intents', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                data: {
                    attributes: {
                        amount: parseInt(amount),
                        payment_method_allowed: ['gcash'],
                        payment_method_options: {
                            card: { request_three_d_secure: 'any' }
                        },
                        currency: 'PHP',
                        description: description || 'Payment Description',
                        metadata: billing ? {
                            customer_name: billing.name,
                            customer_email: billing.email,
                            customer_phone: billing.phone ? billing.phone.replace(/\D/g, '') : '',
                            ...billing.address
                        } : undefined
                    }
                }
            })
        });

        const intentData = await intentResponse.json();
        if (intentData.errors) {
            console.error('PayMongo Intent Error:', intentData.errors);
            return NextResponse.json({ error: intentData.errors[0].detail || 'Failed to create intent' }, { status: 400 });
        }

        const paymentIntentId = intentData.data.id;

        // 2. Create Payment Method (GCash) with Billing Details
        const methodPayload = {
            data: {
                attributes: {
                    type: 'gcash'
                }
            }
        };

        // Add billing details if provided
        if (billing) {
            // Sanitize phone number (remove non-digits)
            const cleanPhone = billing.phone ? billing.phone.replace(/\D/g, '') : '';

            methodPayload.data.attributes.billing = {
                name: billing.name,
                email: billing.email,
                phone: cleanPhone,
                address: billing.address
            };
        } else {
            console.warn('Billing details missing in request');
        }

        const methodResponse = await fetch('https://api.paymongo.com/v1/payment_methods', {
            method: 'POST',
            headers,
            body: JSON.stringify(methodPayload)
        });

        const methodData = await methodResponse.json();
        if (methodData.errors) {
            console.error('PayMongo Method Error:', methodData.errors);
            return NextResponse.json({ error: methodData.errors[0].detail || 'Failed to create payment method' }, { status: 400 });
        }

        const paymentMethodId = methodData.data.id;

        // 3. Attach Payment Method to Intent
        const attachUrl = `https://api.paymongo.com/v1/payment_intents/${paymentIntentId}/attach`;

        // CRITICAL: Use the main production domain to avoid Vercel SSO conflicts
        // Vercel's auto-generated URLs (like budolshap-xxx-projects.vercel.app) trigger SSO
        // We must use the primary production domain
        let returnUrl;

        // Check if we're in development (localhost)
        // DYNAMIC RETURN URL STRATEGY
        // 1. Force localhost if detected in host header (Development)
        // 2. Use NEXT_PUBLIC_BASE_URL if set
        // 3. Fallback to VERCEL_URL or protocol+host

        const host = request.headers.get('host');
        const protocol = request.headers.get('x-forwarded-proto') || 'https';
        const isLocal = host && (host.includes('localhost') || host.includes('127.0.0.1') || host.match(/^\d+\.\d+\.\d+\.\d+$/));

        if (isLocal) {
            returnUrl = `${protocol}://${host}/payment/return`;
        } else {
            let productionUrl = process.env.NEXT_PUBLIC_BASE_URL;

            if (!productionUrl && host) {
                productionUrl = `${protocol}://${host}`;
            }

            if (!productionUrl) {
                productionUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://budolshap-v3.vercel.app';
            }

            returnUrl = `${productionUrl}/payment/return`;
        }

        console.log('🔗 PayMongo Return URL:', returnUrl);
        console.log('🌍 Environment:', process.env.NODE_ENV);
        console.log('📍 VERCEL_ENV:', process.env.VERCEL_ENV);
        console.log('🔧 NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL);
        console.log('🚀 VERCEL_URL:', process.env.VERCEL_URL);

        const attachResponse = await fetch(attachUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                data: {
                    attributes: {
                        payment_method: paymentMethodId,
                        return_url: returnUrl
                    }
                }
            })
        });

        const attachData = await attachResponse.json();
        if (attachData.errors) {
            console.error('PayMongo Attach Error:', attachData.errors);
            return NextResponse.json({ error: attachData.errors[0].detail || 'Failed to attach payment method' }, { status: 400 });
        }

        // 4. Get Redirect URL
        const nextAction = attachData.data.attributes.next_action;
        let checkoutUrl = null;

        if (nextAction && nextAction.type === 'redirect') {
            checkoutUrl = nextAction.redirect.url;
        }

        return NextResponse.json({
            payment_intent_id: paymentIntentId,
            checkout_url: checkoutUrl
        });

    } catch (error) {
        console.error('Internal Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
