/**
 * Base Payment Adapter Interface
 * All payment providers (PayMongo, Xendit, etc.) must extend this class.
 */
export class BasePaymentAdapter {
    constructor() {
        if (this.constructor === BasePaymentAdapter) {
            throw new Error("BasePaymentAdapter cannot be instantiated directly.");
        }
    }

    /**
     * Create a payment intent/source
     * @param {number} amount - Amount in centavos (integer)
     * @param {string} currency - Currency code (e.g., 'PHP')
     * @param {string} method - Payment method (e.g., 'gcash', 'paymaya', 'grab_pay', 'qrph')
     * @param {object} billing - Billing details { name, email, phone, address: { line1, city, state, postal_code, country } }
     * @returns {Promise<object>} - Normalized response { checkoutUrl, paymentIntentId, status, originalResponse }
     */
    async createPaymentIntent(_amount, _currency, _method, _billing) {
        throw new Error("Method 'createPaymentIntent' must be implemented.");
    }

    /**
     * Retrieve a payment intent/source
     * @param {string} id - Payment Intent ID
     * @returns {Promise<object>}
     */
    async getPaymentIntent(_id) {
        throw new Error("Method 'getPaymentIntent' must be implemented.");
    }
}
