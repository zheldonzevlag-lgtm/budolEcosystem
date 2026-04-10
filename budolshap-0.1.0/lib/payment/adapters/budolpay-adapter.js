import { BasePaymentAdapter } from './base-adapter.js';

/**
 * BudolPay Adapter
 * Connects to the budolPay API Gateway (Phase 1)
 */
export class BudolPayAdapter extends BasePaymentAdapter {
    constructor() {
        super();
        
        // --- AGGRESSIVE PRODUCTION MIRROR LOGIC ---
        // 1. Get raw URL from environment, fallback to the VERCEL PRODUCTION gateway
        // This is critical because in Vercel, localhost falls into a void lambda.
        const rawUrl = process.env.PAYMENT_GATEWAY_URL || 'https://payment-gateway-service-two.vercel.app';
        
        // 2. Determine if we must override
        const isVercel = process.env.VERCEL === '1' || !!process.env.NEXT_PUBLIC_VERCEL_ENV;
        const isStaleDuck = rawUrl.includes('duckdns.org');
        
        if (!process.env.PAYMENT_GATEWAY_URL && isVercel) {
            console.warn('[BudolPay Adapter] ⚠️ Using fallback Vercel Gateway URL: ', rawUrl);
        }

        if (isStaleDuck || (isVercel && rawUrl.includes('localhost'))) {
            this.gatewayUrl = 'https://payment-gateway-service-two.vercel.app';
        } else {
            this.gatewayUrl = rawUrl;
        }

        console.log(`[BudolPayAdapter] Initialized. Gateway: ${this.gatewayUrl} | Env Vercel: ${process.env.VERCEL}`);
        
        this.apiKey = process.env.BUDOLPAY_API_KEY || 'bs_key_2025';
        
        // Legacy logic: only append /payments if it's a specific older gateway format
        // We SKIP this for the Vercel healthy mirror to avoid double /payments or incorrect paths
        const isLegacyGateway = (this.gatewayUrl.includes(':8080') || this.gatewayUrl.includes('duckdns.org')) && 
                                !this.gatewayUrl.includes('vercel.app');
        
        if (isLegacyGateway && !this.gatewayUrl.includes('/payments')) {
            console.log(`[BudolPay Adapter] 🌐 Legacy Gateway detected (${this.gatewayUrl}). Adding /payments prefix.`);
            this.gatewayUrl = this.gatewayUrl.endsWith('/') 
                ? `${this.gatewayUrl}payments` 
                : `${this.gatewayUrl}/payments`;
        }
    }

    /**
     * Create a payment intent via budolPay Gateway
     * @param {number} amount - Amount in centavos (integer)
     * @param {string} currency - Currency code (e.g., 'PHP')
     * @param {string} method - Payment method (e.g., 'gcash', 'paymaya')
     * @param {object} billing - Billing details
     * @param {object} options - Additional options
     */
    async createPaymentIntent(amount, currency, method, billing, options = {}) {
        const url = `${this.gatewayUrl}/create-intent`;
        
        // Convert centavos to decimal for budolPay Gateway
        const decimalAmount = amount / 100;

        const body = {
            amount: decimalAmount,
            currency: currency || 'PHP',
            description: options.description || 'Order from budolShap',
            provider: 'internal', 
            paymentMethod: method,
            metadata: {
                orderId: options.orderId || 'unknown',
                orderIds: options.orderIds,
                checkoutId: options.checkoutId,
                app: 'budolShap',
                storeName: options.storeName || 'budolShap Store',
                customer_email: billing?.email,
                customer_name: billing?.name
            }
        };

        console.log(`[BudolPay] Connecting to Gateway: ${url}...`);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const text = await response.text();
                let errorData;
                try {
                    errorData = text ? JSON.parse(text) : { error: 'Empty response from server' };
                } catch (e) {
                    errorData = { error: text || `Server returned ${response.status}` };
                }
                console.error('[BudolPay] Gateway Error:', errorData);
                throw new Error(errorData.error || errorData.message || `BudolPay Gateway error: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                if (!text || text.trim() === '') {
                    throw new Error('BudolPay Gateway returned an empty response. This may be due to an internal service timeout.');
                }
                throw new Error(`Invalid response from BudolPay Gateway: Expected JSON but received ${contentType || 'unknown'}`);
            }

            const data = await response.json();
            let checkoutUrl = data.checkoutUrl || data.checkout_url;
            
            // --- HOSTNAME REWRITE FOR LOCAL IP BROWSING ---
            if (checkoutUrl && options.successUrl) {
                try {
                    const successUrlObj = new URL(options.successUrl);
                    const checkoutUrlObj = new URL(checkoutUrl);
                    if (successUrlObj.hostname !== checkoutUrlObj.hostname && checkoutUrlObj.hostname === 'localhost') {
                        checkoutUrlObj.hostname = successUrlObj.hostname;
                        checkoutUrl = checkoutUrlObj.toString();
                    }
                } catch (e) {
                    console.error('[BudolPay Adapter] Failed to parse URLs:', e.message);
                }
            }
            
            if (checkoutUrl && options.orderId) {
                const hashIndex = checkoutUrl.indexOf('#');
                const separator = checkoutUrl.includes('?') ? '&' : '?';
                const queryParam = `${separator}orderId=${options.orderId}`;
                if (hashIndex !== -1) {
                    checkoutUrl = checkoutUrl.slice(0, hashIndex) + queryParam + checkoutUrl.slice(hashIndex);
                } else {
                    checkoutUrl = checkoutUrl + queryParam;
                }
            }

            // WHY: The gateway returns two different identifiers:
            //   data.referenceId  → JON-YYYYMMDD-XXXXX (human-readable reference, used in URLs)
            //   data.id           → UUID (internal primary key, used in DB queries)
            // Both must be preserved separately so the cancel flow can use the correct one.
            // Previously this adapter stored referenceId as paymentIntentId, losing the UUID.
            const gatewayReferenceId = data.referenceId || data.reference || null;
            const gatewayIntentId = data.id || data.paymentIntentId || data.transactionId || gatewayReferenceId;

            console.log(`[BudolPay Adapter] ✅ Intent created. UUID=${gatewayIntentId} | Ref=${gatewayReferenceId}`);

            return {
                checkoutUrl: checkoutUrl,
                qrCode: {
                    imageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(JSON.stringify({
                        type: 'budolpay_payment',
                        orderId: options.orderId,
                        amount: amount / 100,
                        storeName: options.storeName || 'budolShap Store',
                        paymentIntentId: gatewayIntentId,
                        referenceId: gatewayReferenceId
                    }))}`,
                    amount: amount,
                    label: options.storeName || 'budolShap Store'
                },
                paymentIntentId: gatewayIntentId,
                // WHY: referenceId is the gateway's canonical cancel/status lookup key.
                //      Exposing it here allows OrderSummary.jsx to pass it to /api/payment/cancel.
                referenceId: gatewayReferenceId,
                status: data.status || 'pending',
                originalResponse: data
            };

        } catch (error) {
            // Include diagnostic info in the error message for production troubleshooting
            const debugPrefix = `[Gateway URL: ${this.gatewayUrl}] [ENV VERCEL: ${process.env.VERCEL}]`;
            console.error(`[BudolPay Adapter Error] ${debugPrefix}`, error);
            throw new Error(`Payment initiation failed: ${error.message} ${debugPrefix}`);
        }
    }

    async getPaymentIntent(id) {
        const url = `${this.gatewayUrl}/status/${id}`;
        try {
            const response = await fetch(url, {
                headers: { 'x-api-key': this.apiKey }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to retrieve payment intent');
            return {
                id: id,
                status: data.status,
                isPaid: data.status === 'success' || data.status === 'paid' || data.status === 'succeeded',
                originalResponse: data
            };
        } catch (error) {
            console.error('[BudolPay Adapter Error]', error);
            throw error;
        }
    }

    async verifyTransaction(transactionId) {
        return this.getPaymentIntent(transactionId);
    }
}
