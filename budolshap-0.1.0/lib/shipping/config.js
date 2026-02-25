import { UNIVERSAL_STATUS } from './statusMapper';

export const SHIPPING_PROVIDERS = {
    STANDARD: 'standard',
    LALAMOVE: 'lalamove',
    // Future providers can be added here, e.g., GRAB: 'grab'
};

/**
 * Centralized configuration for Shipping Providers and Tracking Stages
 * Updated to use Universal Status Model (Shopee-inspired)
 */

// Universal status-based stages (Shopee-style)
export const PROVIDER_STAGES = {
    [SHIPPING_PROVIDERS.LALAMOVE]: [
        { label: 'Placed', status: UNIVERSAL_STATUS.ORDER_PLACED, icon: '📝' },
        { label: 'Paid', status: UNIVERSAL_STATUS.PAID, icon: '💳' },
        { label: 'To Ship', status: UNIVERSAL_STATUS.TO_SHIP, icon: '📦' },      // Courier booked, waiting for pickup
        { label: 'Shipping', status: UNIVERSAL_STATUS.SHIPPING, icon: '🚚' },    // Package picked up, in transit
        { label: 'Delivered', status: UNIVERSAL_STATUS.DELIVERED, icon: '✅' }
    ],
    [SHIPPING_PROVIDERS.STANDARD]: [
        { label: 'Placed', status: UNIVERSAL_STATUS.ORDER_PLACED, icon: '📝' },
        { label: 'Paid', status: UNIVERSAL_STATUS.PAID, icon: '💳' },
        { label: 'To Ship', status: UNIVERSAL_STATUS.TO_SHIP, icon: '📦' },
        { label: 'Shipping', status: UNIVERSAL_STATUS.SHIPPING, icon: '🚚' },
        { label: 'Delivered', status: UNIVERSAL_STATUS.DELIVERED, icon: '✅' }
    ]
};

export const TRACKING_REMARKS = {
    [SHIPPING_PROVIDERS.LALAMOVE]: {
        [UNIVERSAL_STATUS.TO_SHIP]: "Courier has been booked. Waiting for driver to pick up your package.",
        [UNIVERSAL_STATUS.SHIPPING]: "Driver has picked up your package. Package is on the way.",
        [UNIVERSAL_STATUS.DELIVERED]: "Your package has been successfully delivered."
    },
    [SHIPPING_PROVIDERS.STANDARD]: {
        [UNIVERSAL_STATUS.TO_SHIP]: "Your order is ready for shipment.",
        [UNIVERSAL_STATUS.SHIPPING]: "Your package is in transit.",
        [UNIVERSAL_STATUS.DELIVERED]: "Your package has been delivered."
    }
};

export const PROVIDER_TIMELINE_EVENTS = {
    [SHIPPING_PROVIDERS.LALAMOVE]: {
        [UNIVERSAL_STATUS.PROCESSING]: { title: 'Processing', description: 'Your order is being prepared' },
        [UNIVERSAL_STATUS.TO_SHIP]: { title: 'To Ship', description: 'Courier booked, waiting for pickup' },
        [UNIVERSAL_STATUS.SHIPPING]: {
            title: 'Shipping',
            description: 'Your package is on the way to your location',
            triggerStatuses: ['PICKED_UP', 'IN_TRANSIT', 'SHIPPING']
        },
        [UNIVERSAL_STATUS.DELIVERED]: { title: 'Delivered', description: 'Package successfully delivered' }
    },
    [SHIPPING_PROVIDERS.STANDARD]: {
        [UNIVERSAL_STATUS.PROCESSING]: { title: 'Processing', description: 'Your order is being prepared for shipment' },
        [UNIVERSAL_STATUS.TO_SHIP]: { title: 'To Ship', description: 'Ready for shipment' },
        [UNIVERSAL_STATUS.SHIPPING]: {
            title: 'Shipping',
            description: 'Package is out for delivery',
            triggerStatuses: ['SHIPPING']
        },
        [UNIVERSAL_STATUS.DELIVERED]: { title: 'Delivered', description: 'Package delivered' }
    }
};
