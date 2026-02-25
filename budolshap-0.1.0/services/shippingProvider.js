/**
 * Base Shipping Provider Interface
 * All shipping carriers (Lalamove, J&T, 2GO, etc.) must implement this interface
 */
export default class ShippingProvider {
    /**
     * Get a shipping quote
     * @param {Object} payload - Quote request data
     * @param {string} payload.pickupAddress - Pickup location
     * @param {string} payload.deliveryAddress - Delivery location
     * @param {number} payload.weight - Package weight in kg
     * @param {Object} payload.dimensions - Package dimensions {length, width, height} in cm
     * @param {string} payload.pickupTime - Preferred pickup time (ISO 8601)
     * @returns {Promise<Object>} Quote details {price, eta, currency, quoteId}
     */
    async getQuote(_payload) {
        throw new Error('getQuote() must be implemented by shipping provider');
    }

    /**
     * Create a delivery order
     * @param {Object} payload - Order creation data
     * @param {string} payload.quoteId - Quote ID from getQuote()
     * @param {string} payload.pickupAddress - Pickup location
     * @param {string} payload.deliveryAddress - Delivery location
     * @param {string} payload.pickupContact - Pickup contact details
     * @param {string} payload.deliveryContact - Delivery contact details
     * @param {Object} payload.packageDetails - Package information
     * @returns {Promise<Object>} Order details {bookingId, trackingUrl, status}
     */
    async createOrder(_payload) {
        throw new Error('createOrder() must be implemented by shipping provider');
    }

    /**
     * Track an existing order
     * @param {string} orderId - Order/Booking ID
     * @returns {Promise<Object>} Tracking details {status, driver, location, eta}
     */
    async trackOrder(_orderId) {
        throw new Error('trackOrder() must be implemented by shipping provider');
    }

    /**
     * Cancel a pending order
     * @param {string} orderId - Order/Booking ID
     * @returns {Promise<Object>} Cancellation result {canceled, reason}
     */
    async cancelOrder(_orderId) {
        throw new Error('cancelOrder() must be implemented by shipping provider');
    }
}
