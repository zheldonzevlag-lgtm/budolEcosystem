import { getNowUTC } from '../dateUtils';

/**
 * BudolShap Seller Shipping Flow - Data Model Contract
 * 
 * This file defines the standardized JSON structure for order.shipping field
 * to support BudolShap - aligned seller fulfillment workflow.
 */

/**
 * Shipping Provider Types
 * Maps to available shipping providers in the system
 */
export const SHIPPING_PROVIDERS = {
  LALAMOVE: 'lalamove',
  MANUAL: 'manual',
  JNT: 'jnt',
  NINJAVAN: 'ninjavan',
  TWOGO: '2go',
  BUDOLSHAP: 'budolshap'
};

/**
 * Shipment Model Types
 * Defines how the package will be handed over to the carrier
 */
export const SHIPMENT_MODELS = {
  PICKUP: 'PICKUP',    // Carrier picks up from seller
  DROPOFF: 'DROPOFF'   // Seller drops off at carrier location
};

/**
 * Shipping Status Flow
 * Aligns with BudolShap's seller fulfillment states
 */
export const SHIPPING_STATUS = {
  NEEDS_ARRANGEMENT: 'NEEDS_ARRANGEMENT',  // Initial state - seller needs to arrange shipment
  ARRANGED: 'ARRANGED',                    // Seller has selected shipment model
  BOOKED: 'BOOKED',                        // Shipping provider booking confirmed
  PICKED_UP: 'PICKED_UP',                  // Package picked up by carrier
  IN_TRANSIT: 'IN_TRANSIT',                // Package in transit
  DELIVERED: 'DELIVERED',                  // Package delivered to buyer
  CANCELLED: 'CANCELLED',                  // Shipping cancelled
  FAILED: 'FAILED'                          // Shipping failed (booking rejected, etc.)
};

/**
 * Standardized Shipping Data Structure
 * This is the contract for the Order.shipping JSON field
 */
export const SHIPPING_DATA_CONTRACT = {
  // Core shipping information
  provider: {
    type: 'string',
    enum: Object.values(SHIPPING_PROVIDERS),
    required: true,
    description: 'Shipping provider handling this shipment'
  },

  shipmentModel: {
    type: 'string',
    enum: Object.values(SHIPMENT_MODELS),
    required: false,
    description: 'How package is handed over to carrier (PICKUP/DROPOFF)'
  },

  status: {
    type: 'string',
    enum: Object.values(SHIPPING_STATUS),
    required: true,
    description: 'Current shipping status'
  },

  // Provider-specific identifiers
  bookingId: {
    type: 'string',
    required: false,
    description: 'Provider booking/reference ID'
  },

  trackingUrl: {
    type: 'string',
    required: false,
    description: 'Public tracking URL for buyer'
  },

  waybillNumber: {
    type: 'string',
    required: false,
    description: 'Waybill/tracking number'
  },

  // Document generation (Phase 3)
  documents: {
    type: 'object',
    required: false,
    properties: {
      waybillPdfUrl: { type: 'string', description: 'Generated waybill PDF URL' },
      packingListPdfUrl: { type: 'string', description: 'Generated packing list PDF URL' },
      combinedPdfUrl: { type: 'string', description: 'Combined documents PDF URL' }
    }
  },

  // SLA and timeline tracking
  shipByAt: {
    type: 'string',
    format: 'date-time',
    required: false,
    description: 'Deadline for shipping (calculated from order date + SLA days)'
  },

  arrangedAt: {
    type: 'string',
    format: 'date-time',
    required: false,
    description: 'When seller arranged shipment'
  },

  handedOverAt: {
    type: 'string',
    format: 'date-time',
    required: false,
    description: 'When package was handed to carrier'
  },

  // Event timeline for tracking history
  timeline: {
    type: 'array',
    required: false,
    items: {
      type: 'object',
      properties: {
        event: { type: 'string', enum: Object.values(SHIPPING_STATUS) },
        timestamp: { type: 'string', format: 'date-time' },
        metadata: { type: 'object', description: 'Additional event data' }
      }
    }
  },

  // Retry and failure tracking
  previousAttempts: {
    type: 'array',
    required: false,
    items: {
      type: 'object',
      properties: {
        bookingId: { type: 'string' },
        failureReason: { type: 'string' },
        failedAt: { type: 'string', format: 'date-time' }
      }
    }
  },

  // Metadata for extensibility
  metadata: {
    type: 'object',
    required: false,
    description: 'Provider-specific metadata'
  }
};

/**
 * Helper function to validate shipping data against the contract
 * @param {Object} shippingData - The shipping data to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export function validateShippingData(shippingData) {
  const errors = [];

  // Check required fields
  if (!shippingData.provider) {
    errors.push('provider is required');
  } else if (!Object.values(SHIPPING_PROVIDERS).includes(shippingData.provider)) {
    errors.push(`provider must be one of: ${Object.values(SHIPPING_PROVIDERS).join(', ')}`);
  }

  if (!shippingData.status) {
    errors.push('status is required');
  } else if (!Object.values(SHIPPING_STATUS).includes(shippingData.status)) {
    errors.push(`status must be one of: ${Object.values(SHIPPING_STATUS).join(', ')}`);
  }

  // Validate shipment model if provided
  if (shippingData.shipmentModel && !Object.values(SHIPMENT_MODELS).includes(shippingData.shipmentModel)) {
    errors.push(`shipmentModel must be one of: ${Object.values(SHIPMENT_MODELS).join(', ')}`);
  }

  // Validate timeline events
  if (shippingData.timeline) {
    shippingData.timeline.forEach((event, index) => {
      if (!event.event || !Object.values(SHIPPING_STATUS).includes(event.event)) {
        errors.push(`timeline[${index}].event must be a valid shipping status`);
      }
      if (!event.timestamp) {
        errors.push(`timeline[${index}].timestamp is required`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Helper function to create initial shipping data for a new order
 * @param {string} provider - Shipping provider
 * @param {Object} options - Additional options
 * @returns {Object} - Initial shipping data object
 */
export function createInitialShippingData(provider, options = {}) {
  const initialData = {
    provider,
    status: SHIPPING_STATUS.NEEDS_ARRANGEMENT,
    timeline: [{
      event: SHIPPING_STATUS.NEEDS_ARRANGEMENT,
      timestamp: getNowUTC().toISOString(),
      metadata: { reason: 'Order placed, awaiting shipment arrangement' }
    }]
  };

  // Add shipment model if provided
  if (options.shipmentModel) {
    initialData.shipmentModel = options.shipmentModel;
  }

  // Add ship-by deadline if SLA days provided
  if (options.slaDays) {
    const shipByDate = getNowUTC();
    shipByDate.setDate(shipByDate.getDate() + options.slaDays);
    initialData.shipByAt = shipByDate.toISOString();
  }

  return initialData;
}

/**
 * Helper function to update shipping status with timeline tracking
 * @param {Object} currentShipping - Current shipping data
 * @param {string} newStatus - New status to set
 * @param {Object} metadata - Additional metadata for the status change
 * @returns {Object} - Updated shipping data
 */
export function updateShippingStatus(currentShipping, newStatus, metadata = {}) {
  const updatedShipping = { ...currentShipping };

  // Update status
  updatedShipping.status = newStatus;

  // Add to timeline
  if (!updatedShipping.timeline) {
    updatedShipping.timeline = [];
  }

  updatedShipping.timeline.push({
    event: newStatus,
    timestamp: getNowUTC().toISOString(),
    metadata
  });

  // Set specific timestamp fields based on status
  const now = getNowUTC().toISOString();

  switch (newStatus) {
    case SHIPPING_STATUS.ARRANGED:
      updatedShipping.arrangedAt = now;
      break;
    case SHIPPING_STATUS.BOOKED:
      // bookingId should be set when calling this function
      break;
    case SHIPPING_STATUS.PICKED_UP:
      updatedShipping.handedOverAt = now;
      break;
    case SHIPPING_STATUS.DELIVERED:
      // Delivery completed
      break;
    case SHIPPING_STATUS.CANCELLED:
    case SHIPPING_STATUS.FAILED:
      // Track failure reason in metadata
      break;
  }

  return updatedShipping;
}