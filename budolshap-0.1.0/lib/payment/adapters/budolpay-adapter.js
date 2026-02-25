import { BasePaymentAdapter } from './base-adapter.js';

/**
 * BudolPay Adapter
 * Connects to the budolPay API Gateway (Phase 1)
 */
export class BudolPayAdapter extends BasePaymentAdapter {
    constructor() {
        super();
        this.gatewayUrl = process.env.PAYMENT_GATEWAY_URL || process.env.GATEWAY_URL || `http://${process.env.LOCAL_IP || 'localhost'}:8004`;
        this.apiKey = process.env.BUDOLPAY_API_KEY || 'bs_key_2025';
        
        // If using the main API Gateway (8080), ensure the /payments prefix is present
        if (this.gatewayUrl.includes(':8080') && !this.gatewayUrl.includes('/payments')) {
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
        
        // Convert centavos to decimal for budolPay Gateway if needed
        // The documentation example shows 100.00 for PHP 100
        const decimalAmount = amount / 100;

        const body = {
            amount: decimalAmount,
            currency: currency || 'PHP',
            description: options.description || 'Order from budolShap',
            provider: 'internal', // Explicitly use budolPay internal wallet flow
            paymentMethod: method, // Optional: if gateway supports pre-selecting method
            metadata: {
                orderId: options.orderId || 'unknown',
                orderIds: options.orderIds, // Support for multi-store orders
                checkoutId: options.checkoutId, // Support for master checkout
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

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error(`[BudolPay] Expected JSON but received ${contentType}. Raw response:`, text.slice(0, 500));
                throw new Error(`Invalid response from BudolPay Gateway: Expected JSON but received ${contentType || 'unknown'}`);
            }

            const data = await response.json();

            if (!response.ok) {
                console.error('[BudolPay] Gateway Error:', data);
                throw new Error(data.error || data.message || 'Failed to connect to budolPay Gateway');
            }

            console.log('[BudolPay] ✅ Gateway Response:', JSON.stringify(data, null, 2));

            // The gateway should return a checkoutUrl and a paymentIntentId
            let checkoutUrl = data.checkoutUrl || data.checkout_url;
            
            // --- FIX FOR IP-BASED BROWSING (Localhost Mismatch) ---
            // If the user is browsing via IP (e.g. 192.168.1.x), the gateway might 
            // return a 'localhost' URL because it's called from the backend.
            // We need to rewrite it to the actual host the user is using.
            if (checkoutUrl && options.successUrl) {
                try {
                    const successUrlObj = new URL(options.successUrl);
                    const checkoutUrlObj = new URL(checkoutUrl);
                    
                    // If successUrl is on an IP/different host, but checkoutUrl is on localhost
                    if (successUrlObj.hostname !== checkoutUrlObj.hostname && checkoutUrlObj.hostname === 'localhost') {
                        console.log(`[BudolPay Adapter] 🔄 Hostname mismatch detected. Rewriting checkoutUrl from ${checkoutUrlObj.hostname} to ${successUrlObj.hostname}`);
                        checkoutUrlObj.hostname = successUrlObj.hostname; // This replaces only the hostname, keeping the original port
                        checkoutUrl = checkoutUrlObj.toString();
                    }
                } catch (e) {
                    console.error('[BudolPay Adapter] Failed to parse URLs for hostname fix:', e.message);
                }
            }
            
            if (checkoutUrl && options.orderId) {
                // If there's a fragment (#), insert before it
                const hashIndex = checkoutUrl.indexOf('#');
                const separator = checkoutUrl.includes('?') ? '&' : '?';
                const queryParam = `${separator}orderId=${options.orderId}`;
                
                if (hashIndex !== -1) {
                    checkoutUrl = checkoutUrl.slice(0, hashIndex) + queryParam + checkoutUrl.slice(hashIndex);
                } else {
                    checkoutUrl = checkoutUrl + queryParam;
                }
            }

            const paymentIntentId = data.referenceId || data.id || data.paymentIntentId || data.reference;

            return {
                checkoutUrl: checkoutUrl,
                qrCode: {
                    imageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(JSON.stringify({
                        type: 'budolpay_payment',
                        orderId: options.orderId,
                        amount: amount / 100,
                        storeName: options.storeName || 'budolShap Store',
                        paymentIntentId: paymentIntentId
                    }))}`,
                    amount: amount,
                label: options.storeName || 'budolShap Store'
            },
                paymentIntentId: paymentIntentId,
                status: data.status || 'pending',
                originalResponse: data
            };

        } catch (error) {
            console.error('[BudolPay Adapter Error]', error);
            throw error;
        }
    }

    /**
     * Retrieve a payment intent from budolPay Gateway
     * @param {string} id - Payment Intent ID
     */
    async getPaymentIntent(id) {
        const url = `${this.gatewayUrl}/status/${id}`;

        try {
            const response = await fetch(url, {
                headers: {
                    'x-api-key': this.apiKey
                }
            });

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error(`[BudolPay] Expected JSON but received ${contentType}. Raw response:`, text.slice(0, 500));
                throw new Error(`Invalid response from BudolPay Gateway: Expected JSON but received ${contentType || 'unknown'}`);
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to retrieve payment intent');
            }

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

    /**
     * Verify a transaction status (Phase 2: Transaction Service)
     * @param {string} transactionId - Transaction or Payment Intent ID
     */
    async verifyTransaction(transactionId) {
        return this.getPaymentIntent(transactionId);
    }
}
