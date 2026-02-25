import Lalamove from './lalamove.js';
import FallbackProvider from './fallbackProvider.js';

/**
 * Shipping Provider Factory
 * Returns the appropriate shipping provider instance based on provider name
 */
export class ShippingFactory {
    /**
     * Get a shipping provider instance
     * @param {string} providerName - Name of the provider ('lalamove', 'jnt', '2go', etc.)
     * @returns {Object} Provider instance
     */
    static getProvider(providerName) {
        switch (providerName?.toLowerCase()) {
            case 'lalamove':
                return new Lalamove();
            case 'fallback':
                return new FallbackProvider();

            default:
                throw new Error(`Unsupported shipping provider: ${providerName}`);
        }
    }

    /**
     * Get list of available providers
     * @returns {Array<string>} List of provider names
     */
    static getAvailableProviders() {
        return [
            'lalamove',
            'fallback'
        ];
    }

    /**
     * Check if a provider is available
     * @param {string} providerName - Provider name to check
     * @returns {boolean} True if provider is available
     */
    static isProviderAvailable(providerName) {
        return this.getAvailableProviders().includes(providerName?.toLowerCase());
    }
}

// Export a helper function as well
export const getShippingProvider = (providerName) => {
    return ShippingFactory.getProvider(providerName);
};

export default ShippingFactory;
