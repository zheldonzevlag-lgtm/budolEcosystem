import { PayMongoAdapter } from './adapters/paymongo-adapter';
import { BudolPayAdapter } from './adapters/budolpay-adapter';

// TODO: Import other adapters here in the future
// import { XenditAdapter } from './adapters/xendit-adapter';

class PaymentService {
    constructor() {
        this.adapters = {
            'paymongo': new PayMongoAdapter(),
            'budolpay': new BudolPayAdapter(),
            // 'xendit': new XenditAdapter(),
        };
    }

    /**
     * Initiate a payment flow
     * @param {string} provider - 'paymongo', 'xendit', etc.
     * @param {number} amount - Amount in centavos
     * @param {string} currency - 'PHP', 'USD'
     * @param {string} method - 'gcash', 'paymaya', 'grab_pay', 'qrph'
     * @param {object} billing - Billing info
     * @param {object} options - { successUrl, cancelUrl, description }
     * @returns {Promise<object>} - { checkoutUrl, paymentIntentId }
     */
    async initiatePayment(provider, amount, currency, method, billing, options = {}) {
        const adapter = this.adapters[provider];

        if (!adapter) {
            throw new Error(`Payment provider '${provider}' is not supported.`);
        }

        console.log(`[PaymentService] Initiating ${method} payment via ${provider}...`);

        return await adapter.createPaymentIntent(amount, currency, method, billing, options);
    }
}

// Export a singleton instance
export const paymentService = new PaymentService();
