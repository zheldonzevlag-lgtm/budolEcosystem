import { BasePaymentAdapter } from './base-adapter';

export class PayMongoAdapter extends BasePaymentAdapter {
    constructor() {
        super();
        this.secretKey = process.env.PAYMONGO_SECRET_KEY;
        this.apiUrl = 'https://api.paymongo.com/v1';

        if (!this.secretKey) {
            console.error('PAYMONGO_SECRET_KEY is missing');
        }
    }

    getAuthHeader() {
        return `Basic ${Buffer.from(this.secretKey + ':').toString('base64')}`;
    }

    async createPaymentIntent(amount, currency, method, billing, options = {}) {
        const headers = {
            accept: 'application/json',
            'content-type': 'application/json',
            authorization: this.getAuthHeader()
        };

        // 1. Create Payment Intent
        const intentBody = {
            data: {
                attributes: {
                    amount: Math.round(amount), // Ensure integer (centavos)
                    payment_method_allowed: [method], // Restrict to the chosen method
                    payment_method_options: {
                        card: { request_three_d_secure: 'any' }
                    },
                    currency: currency,
                    description: options.description || 'Order Payment',
                    capture_type: 'automatic',
                    metadata: {
                        orderId: options.orderId, // CRITICAL: for webhook matching
                        orderIds: JSON.stringify(options.orderIds || []), // PayMongo metadata values must be strings? Or flat objects. Safer to stringify arrays.
                        checkoutId: options.checkoutId, // CRITICAL: for master checkout linking
                        customer_name: billing?.name,
                        customer_email: billing?.email,
                        customer_phone: billing?.phone,
                        ...billing?.address
                    }
                }
            }
        };

        console.log(`[PayMongo] Creating Intent for ${method}...`);
        
        // Log masked key for debugging environment issues
        const maskedKey = this.secretKey ? `${this.secretKey.substring(0, 4)}...${this.secretKey.substring(this.secretKey.length - 4)}` : 'MISSING';
        console.log(`[PayMongo] Using Secret Key: ${maskedKey}`);

        try {
            const intentResp = await fetch(`${this.apiUrl}/payment_intents`, {
                method: 'POST',
                headers,
                body: JSON.stringify(intentBody)
            });
            const intentData = await intentResp.json();

            if (intentData.errors) {
                console.error('[PayMongo] Intent Creation Failed:', intentData.errors);
                throw new Error(intentData.errors[0].detail || 'Failed to create payment intent');
            }

            const paymentIntentId = intentData.data.id;
            console.log(`[PayMongo] Created Payment Intent ID: ${paymentIntentId}`);

            // 2. Create Payment Method
            const methodBody = {
                data: {
                    attributes: {
                        type: method,
                        billing: billing ? {
                            name: billing.name,
                            email: billing.email,
                            phone: billing.phone,
                            address: billing.address
                        } : undefined
                    }
                }
            };

            const methodResp = await fetch(`${this.apiUrl}/payment_methods`, {
                method: 'POST',
                headers,
                body: JSON.stringify(methodBody)
            });
            const methodData = await methodResp.json();

            if (methodData.errors) {
                console.error('[PayMongo] Method Creation Failed:', methodData.errors);
                throw new Error(methodData.errors[0].detail || 'Failed to create payment method');
            }

            const paymentMethodId = methodData.data.id;

            // 3. Attach Payment Method to Intent
            const fallbackUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://budolshap-v3.vercel.app').replace(/\/$/, '');
            const returnUrl = options.successUrl || (fallbackUrl.startsWith('http') ? `${fallbackUrl}/payment/success` : `https://${fallbackUrl}/payment/success`);

            const attachBody = {
                data: {
                    attributes: {
                        payment_method: paymentMethodId,
                        return_url: returnUrl
                    }
                }
            };

            const attachResp = await fetch(`${this.apiUrl}/payment_intents/${paymentIntentId}/attach`, {
                method: 'POST',
                headers,
                body: JSON.stringify(attachBody)
            });
            const attachData = await attachResp.json();

            if (attachData.errors) {
                console.error('[PayMongo] Attach Failed:', attachData.errors);
                throw new Error(attachData.errors[0].detail || 'Failed to attach payment method');
            }

            // 4. Extract Redirect URL or QR Code
            const nextAction = attachData.data.attributes.next_action;
            let checkoutUrl = null;
            let qrCode = null;

            console.log('[PayMongo] Attach Response Status:', attachData.data.attributes.status);
            console.log('[PayMongo] Next Action:', nextAction);

            if (nextAction && nextAction.type === 'redirect') {
                // GCash flow - redirect to PayMongo page
                checkoutUrl = nextAction.redirect.url;
                console.log('[PayMongo] ✅ Checkout URL extracted:', checkoutUrl);
            } else if (nextAction && nextAction.type === 'consume_qr') {
                // QRPh/Maya/GrabPay flow - show QR code
                qrCode = {
                    id: nextAction.code.id,
                    amount: nextAction.code.amount,
                    label: nextAction.code.label,
                    imageUrl: nextAction.code.image_url
                };
                console.log('[PayMongo] ✅ QR Code extracted:', qrCode.id);
            } else if (attachData.data.attributes.status === 'succeeded') {
                // Already paid (unlikely for async methods but possible)
                checkoutUrl = returnUrl;
                console.log('[PayMongo] ⚠️ Payment already succeeded, using return URL');
            } else {
                console.error('[PayMongo] ❌ No redirect URL or QR code found. Full response:', JSON.stringify(attachData.data, null, 2));
            }

            return {
                checkoutUrl,
                qrCode,
                paymentIntentId,
                status: attachData.data.attributes.status,
                originalResponse: attachData.data
            };

        } catch (error) {
            console.error('[PayMongo Adapter Error]', error);
            throw error;
        }
    }
}
