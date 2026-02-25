'use client';

import LalamoveTracking from './LalamoveTracking';
import StandardDeliveryMap from './StandardDeliveryMap';

/**
 * Universal Tracking Map Component
 * 
 * Acts as a factory to render the correct map/tracking interface based on the
 * shipping provider. This decouples the main order page from specific provider logic.
 */
export default function UniversalTrackingMap({ order }) {
    // Check for an active return that has shipping info
    // We consider a return "active" for tracking if it has a booking ID
    const activeReturn = order?.returns?.find(r =>
        r.returnShipping?.bookingId &&
        ['BOOKED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'REFUNDED', 'RECEIVED'].includes(r.status)
    );

    // If there is an active return, we use its shipping info and status for the tracking display
    // We create a proxy order object to pass to the tracking component
    const trackingOrder = activeReturn ? {
        ...order,
        status: activeReturn.status, // Override global status with return status for tracking visualization
        shipping: activeReturn.returnShipping
    } : order;

    if (!trackingOrder || !trackingOrder.shipping) {
        return <StandardDeliveryMap order={trackingOrder || order} />;
    }

    const provider = trackingOrder.shipping.provider?.toLowerCase();

    switch (provider) {
        case 'lalamove':
            return <LalamoveTracking order={trackingOrder} />;

        // Future providers can be added here easily
        // case 'grab':
        //     return <GrabTracking order={trackingOrder} />;
        // case 'jnt':
        //     return <JNTTracking order={trackingOrder} />;

        default:
            // Fallback for 'standard' or unknown providers
            return <StandardDeliveryMap order={trackingOrder} />;
    }
}
