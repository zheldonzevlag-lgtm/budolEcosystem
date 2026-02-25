/**
 * Universal Status Mapper
 * 
 * Provides courier-agnostic status mapping inspired by Shopee's model.
 * Maps courier-specific statuses to universal statuses for consistent UI display.
 * 
 * Universal Status Flow:
 * ORDER_PLACED → PAID → PROCESSING → TO_SHIP → SHIPPING → DELIVERED
 * 
 * Return Flow:
 * RETURN_REQUESTED → RETURN_APPROVED → TO_PICKUP → SHIPPING → DELIVERED → REFUNDED
 */

// Universal order statuses (Must match OrderStatus enum in prisma/schema.prisma)
export const UNIVERSAL_STATUS = {
    // Order lifecycle
    ORDER_PLACED: 'ORDER_PLACED',
    PAYMENT_PENDING: 'PAYMENT_PENDING',
    PENDING_VERIFICATION: 'PENDING_VERIFICATION',
    PAID: 'PAID',
    PROCESSING: 'PROCESSING',
    TO_SHIP: 'PROCESSING',           // Map to PROCESSING for DB (Logical category in UI)
    SHIPPING: 'SHIPPED',            // Map to SHIPPED for DB (Matches Prisma Enum)
    DELIVERED: 'DELIVERED',        // Final delivery
    COMPLETED: 'COMPLETED',        // Order closed
    CANCELLED: 'CANCELLED',        // Terminated

    // Return lifecycle (Logical states)
    RETURN_REQUESTED: 'RETURN_REQUESTED',
    RETURN_APPROVED: 'RETURN_APPROVED',
    RETURN_DISPUTED: 'RETURN_DISPUTED',
    TO_PICKUP: 'PROCESSING',        // Mapping for returns during pickup phase
    REFUNDED: 'REFUNDED'
};

// Lalamove-specific status mapping
export const LALAMOVE_STATUS_MAP = {
    // Driver assignment phase - courier booked but not picked up yet
    'ASSIGNING_DRIVER': UNIVERSAL_STATUS.TO_SHIP,
    'ON_GOING': UNIVERSAL_STATUS.TO_SHIP,          // Driver heading TO pickup location
    'PICKUP_IN_PROGRESS': UNIVERSAL_STATUS.TO_SHIP,

    // Package picked up - now in transit
    'PICKED_UP': UNIVERSAL_STATUS.SHIPPING,
    'IN_TRANSIT': UNIVERSAL_STATUS.SHIPPING,
    'ON_THE_WAY': UNIVERSAL_STATUS.SHIPPING,

    // Delivery completed
    'COMPLETED': UNIVERSAL_STATUS.DELIVERED,
    'DELIVERED': UNIVERSAL_STATUS.DELIVERED,
    'SUCCEEDED': UNIVERSAL_STATUS.DELIVERED,

    // Cancellation/Failure
    'CANCELLED': UNIVERSAL_STATUS.CANCELLED,
    'CANCELED': UNIVERSAL_STATUS.CANCELLED,        // US spelling variant
    'EXPIRED': UNIVERSAL_STATUS.CANCELLED,
    'REJECTED': UNIVERSAL_STATUS.CANCELLED
};

// Return-specific Lalamove mapping
export const LALAMOVE_RETURN_STATUS_MAP = {
    'ASSIGNING_DRIVER': UNIVERSAL_STATUS.TO_PICKUP,
    'ON_GOING': UNIVERSAL_STATUS.TO_PICKUP,
    'PICKUP_IN_PROGRESS': UNIVERSAL_STATUS.TO_PICKUP,
    'PICKED_UP': 'PICKED_UP',
    'IN_TRANSIT': UNIVERSAL_STATUS.SHIPPING,
    'ON_THE_WAY': UNIVERSAL_STATUS.SHIPPING,
    'COMPLETED': UNIVERSAL_STATUS.DELIVERED,       // Delivered to seller
    'DELIVERED': UNIVERSAL_STATUS.DELIVERED,
    'SUCCEEDED': UNIVERSAL_STATUS.DELIVERED,
    'CANCELLED': UNIVERSAL_STATUS.RETURN_APPROVED, // Reset to approved so seller can rebook
    'CANCELED': UNIVERSAL_STATUS.RETURN_APPROVED,
    'EXPIRED': UNIVERSAL_STATUS.RETURN_APPROVED,
    'REJECTED': UNIVERSAL_STATUS.RETURN_APPROVED
};

/**
 * Normalize courier status to universal status
 * @param {string} courierStatus - Raw status from courier (e.g., Lalamove)
 * @param {string} provider - Courier provider name (e.g., 'lalamove')
 * @param {boolean} isReturn - Whether this is a return shipment
 * @returns {string} Universal status
 */
export function normalizeStatus(courierStatus, provider = 'lalamove', isReturn = false) {
    if (!courierStatus) return null;

    // Standardize: Uppercase and replace spaces with underscores (e.g. "Picked Up" -> "PICKED_UP")
    const statusUpper = courierStatus.toUpperCase().trim().replace(/\s+/g, '_');

    // Select appropriate mapping based on provider and shipment type
    if (provider.toLowerCase() === 'lalamove') {
        const mapping = isReturn ? LALAMOVE_RETURN_STATUS_MAP : LALAMOVE_STATUS_MAP;
        return mapping[statusUpper] || null;
    }

    // Future: Add other providers here (J&T, Grab, etc.)

    return null;
}

/**
 * Get user-friendly label for universal status
 * @param {string} status - Universal status
 * @param {boolean} isReturn - Whether this is a return
 * @returns {string} Display label
 */
export function getStatusLabel(status, isReturn = false) {
    const labels = {
        [UNIVERSAL_STATUS.ORDER_PLACED]: 'Order Placed',
        [UNIVERSAL_STATUS.PAYMENT_PENDING]: 'Payment Pending',
        [UNIVERSAL_STATUS.PENDING_VERIFICATION]: 'Verifying Payment',
        [UNIVERSAL_STATUS.PAID]: 'Paid',
        [UNIVERSAL_STATUS.PROCESSING]: 'Processing',
        [UNIVERSAL_STATUS.TO_SHIP]: isReturn ? 'To Pick Up' : 'To Ship',
        [UNIVERSAL_STATUS.SHIPPING]: isReturn ? 'Shipping to Seller' : 'Shipping',
        'SHIPPED': isReturn ? 'Shipping to Seller' : 'Shipping',
        'PICKED_UP': 'Picked Up',
        'IN_TRANSIT': isReturn ? 'Shipping to Seller' : 'Shipping',
        [UNIVERSAL_STATUS.DELIVERED]: isReturn ? 'Delivered to Seller' : 'Delivered',
        [UNIVERSAL_STATUS.COMPLETED]: 'Completed',
        [UNIVERSAL_STATUS.CANCELLED]: 'Cancelled',
        [UNIVERSAL_STATUS.RETURN_REQUESTED]: 'Return Requested',
        [UNIVERSAL_STATUS.RETURN_APPROVED]: 'Return Approved',
        [UNIVERSAL_STATUS.RETURN_DISPUTED]: 'Return Disputed',
        [UNIVERSAL_STATUS.TO_PICKUP]: isReturn ? 'To Pick Up' : 'To Ship',
        [UNIVERSAL_STATUS.REFUNDED]: 'Returned & Refunded'
    };

    return labels[status] || status;
}

/**
 * Get status color/style class
 * @param {string} status - Universal status
 * @returns {string} Tailwind CSS classes
 */
export function getStatusColor(status) {
    const colors = {
        [UNIVERSAL_STATUS.ORDER_PLACED]: 'bg-blue-100 text-blue-700',
        [UNIVERSAL_STATUS.PAYMENT_PENDING]: 'bg-yellow-100 text-yellow-700',
        [UNIVERSAL_STATUS.PENDING_VERIFICATION]: 'bg-yellow-100 text-yellow-700',
        [UNIVERSAL_STATUS.PAID]: 'bg-green-100 text-green-700',
        [UNIVERSAL_STATUS.PROCESSING]: 'bg-indigo-100 text-indigo-700',
        [UNIVERSAL_STATUS.TO_SHIP]: 'bg-orange-100 text-orange-700',
        'PICKED_UP': 'bg-blue-100 text-blue-700',
        [UNIVERSAL_STATUS.SHIPPING]: 'bg-blue-100 text-blue-700',
        [UNIVERSAL_STATUS.DELIVERED]: 'bg-green-100 text-green-700',
        [UNIVERSAL_STATUS.COMPLETED]: 'bg-slate-100 text-slate-700',
        [UNIVERSAL_STATUS.CANCELLED]: 'bg-red-100 text-red-700',
        [UNIVERSAL_STATUS.RETURN_REQUESTED]: 'bg-yellow-100 text-yellow-700',
        [UNIVERSAL_STATUS.RETURN_APPROVED]: 'bg-orange-100 text-orange-700',
        [UNIVERSAL_STATUS.RETURN_DISPUTED]: 'bg-red-100 text-red-700',
        [UNIVERSAL_STATUS.TO_PICKUP]: 'bg-orange-100 text-orange-700',
        [UNIVERSAL_STATUS.REFUNDED]: 'bg-purple-100 text-purple-700'
    };

    return colors[status] || 'bg-slate-100 text-slate-700';
}

/**
 * Determine if a status is terminal (no further updates expected)
 * @param {string} status - Universal status
 * @returns {boolean}
 */
export function isTerminalStatus(status) {
    return [
        UNIVERSAL_STATUS.COMPLETED,
        UNIVERSAL_STATUS.CANCELLED,
        UNIVERSAL_STATUS.REFUNDED
    ].includes(status);
}

/**
 * Determine if a status is active (requires monitoring/updates)
 * @param {string} status - Universal status
 * @returns {boolean}
 */
export function isActiveStatus(status) {
    return [
        UNIVERSAL_STATUS.TO_SHIP,
        UNIVERSAL_STATUS.SHIPPING,
        UNIVERSAL_STATUS.TO_PICKUP,
        'PICKED_UP'
    ].includes(status);
}
