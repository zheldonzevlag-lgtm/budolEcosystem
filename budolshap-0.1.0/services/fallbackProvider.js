import ShippingProvider from './shippingProvider.js';
import { getNowUTC } from '../lib/dateUtils.js';

/**
 * Fallback Shipping Provider
 * Provides estimated quotes when primary providers are unavailable
 * Uses distance-based pricing with configurable rates
 */
export default class FallbackProvider extends ShippingProvider {
    constructor() {
        super();
        this.name = 'fallback';
        this.displayName = 'Standard Delivery';
        
        // Base rates per kilometer (in PHP)
        this.baseRates = {
            MOTORCYCLE: 25,    // Base rate per km
            CAR: 40,           // Base rate per km
            VAN: 60,           // Base rate per km
            TRUCK: 80          // Base rate per km
        };
        
        // Minimum charges
        this.minimumCharges = {
            MOTORCYCLE: 80,
            CAR: 120,
            VAN: 200,
            TRUCK: 300
        };
        
        // Maximum charges
        this.maximumCharges = {
            MOTORCYCLE: 300,
            CAR: 500,
            VAN: 800,
            TRUCK: 1200
        };
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     */
    calculateDistance(coord1, coord2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(coord2.lat - coord1.lat);
        const dLng = this.toRadians(coord2.lng - coord1.lng);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(this.toRadians(coord1.lat)) * Math.cos(this.toRadians(coord2.lat)) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Get estimated quote
     */
    async getQuote(payload) {
        console.log('[Fallback Provider] Calculating estimated quote');
        
        try {
            const { serviceType = 'MOTORCYCLE', stops } = payload;
            
            if (!stops || stops.length < 2) {
                throw new Error('At least 2 stops required (pickup and delivery)');
            }

            const pickup = stops[0];
            const delivery = stops[stops.length - 1];
            
            // Calculate distance
            const distance = this.calculateDistance(
                pickup.coordinates,
                delivery.coordinates
            );
            
            // Calculate base price
            const baseRate = this.baseRates[serviceType] || this.baseRates.MOTORCYCLE;
            let estimatedPrice = distance * baseRate;
            
            // Apply minimum charge
            const minCharge = this.minimumCharges[serviceType] || this.minimumCharges.MOTORCYCLE;
            if (estimatedPrice < minCharge) {
                estimatedPrice = minCharge;
            }
            
            // Apply maximum charge cap
            const maxCharge = this.maximumCharges[serviceType] || this.maximumCharges.MOTORCYCLE;
            if (estimatedPrice > maxCharge) {
                estimatedPrice = maxCharge;
            }
            
            // Add small surcharge for fallback service
            const finalPrice = Math.round(estimatedPrice * 1.1); // 10% surcharge for fallback
            
            // Estimate delivery time (30 minutes + 5 minutes per km)
            const estimatedMinutes = 30 + (distance * 5);
            const estimatedDeliveryTime = new Date(getNowUTC().getTime() + estimatedMinutes * 60000).toISOString();
            
            console.log('[Fallback Provider] Quote calculated:', {
                distance: `${distance.toFixed(2)} km`,
                serviceType,
                estimatedPrice: finalPrice,
                estimatedDeliveryTime
            });
            
            return {
                quotationId: `FALLBACK_${getNowUTC().getTime()}`,
                serviceType,
                priceBreakdown: {
                    base: Math.round(estimatedPrice),
                    surcharge: Math.round(estimatedPrice * 0.1), // 10% surcharge
                    total: finalPrice,
                    currency: 'PHP'
                },
                distance: {
                    value: Math.round(distance * 1000), // meters
                    unit: 'm'
                },
                estimatedPickupTime: new Date(getNowUTC().getTime() + 15 * 60000).toISOString(), // 15 minutes
                estimatedDeliveryTime,
                expiresAt: new Date(getNowUTC().getTime() + 30 * 60000).toISOString(), // 30 minutes
                isManualReview: false,
                stops: stops,
                isFallback: true // Mark as fallback quote
            };
            
        } catch (error) {
            console.error('[Fallback Provider] Error calculating quote:', error);
            throw new Error(`Failed to calculate estimated delivery cost: ${error.message}`);
        }
    }

    /**
     * Fallback provider cannot actually book orders, so this throws an error
     */
    async bookOrder(_payload) {
        throw new Error('Fallback provider cannot book orders. Please use a real shipping provider.');
    }

    /**
     * Fallback provider cannot track orders
     */
    async trackOrder(_orderId) {
        throw new Error('Fallback provider cannot track orders.');
    }

    /**
     * Check if provider is available (always true for fallback)
     */
    async isAvailable() {
        return true;
    }
}