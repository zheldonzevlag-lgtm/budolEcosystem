/**
 * Shipping Service
 * Service layer for shipping operations
 * Phase 5: Extracted as independent service boundary
 * Phase 1: Enhanced with BudolShap shipping data model contract
 */

import { prisma } from '@/lib/prisma';
import { sendOrderStatusEmail } from '@/lib/email';
import { triggerRealtimeEvent } from '@/lib/realtime';
import {
    SHIPPING_PROVIDERS,
    SHIPPING_STATUS,
    SHIPMENT_MODELS,
    validateShippingData,
    createInitialShippingData,
    updateShippingStatus as updateShippingStatusContract
} from '@/lib/shipping/shippingContract';
import { isBudolShapShippingEnabledServer, getBudolShapShippingSLADaysServer } from '@/lib/shipping/featureFlags';
import { getShippingProvider } from '@/services/shippingFactory';

/**
 * Helper to normalize PH phone numbers to E.164 (+63)
 */
const formatPhone = (raw) => {
    if (!raw) return null;
    const digits = String(raw).replace(/\D/g, '');
    if (!digits) return null;
    // If already starts with country code 63
    if (digits.startsWith('63')) {
        return `+${digits}`;
    }
    // If starts with 0, swap to +63
    if (digits.startsWith('0')) {
        return `+63${digits.slice(1)}`;
    }
    // If already starts with + treat as E.164
    if (raw.startsWith('+')) {
        return raw;
    }
    // Fallback: assume it's local without 0 prefix
    return `+63${digits}`;
};

/**
 * Book return shipping (swaps pickup and delivery)
 * @param {object} bookingData - Booking request data
 * @returns {Promise<object>} Booking details
 */
export async function bookReturnShipping(bookingData) {
    const { orderId, returnId, provider = 'lalamove', serviceType = 'MOTORCYCLE' } = bookingData;

    if (!orderId || !returnId) {
        throw new Error('Order ID and Return ID are required');
    }

    // 1. Fetch Return Request and Order
    const returnRequest = await prisma.return.findUnique({
        where: { id: returnId },
        include: {
            order: {
                include: {
                    address: true,
                    store: {
                        include: { addresses: true }
                    },
                    user: true
                }
            }
        }
    });

    if (!returnRequest) throw new Error('Return request not found');
    const order = returnRequest.order;

    // 2. Prepare Swapped Locations
    // Pickup: Buyer's Address
    const pickup = {
        address: `${order.address.street}, ${order.address.barangay}, ${order.address.city}`,
        coordinates: {
            lat: order.address.latitude || 14.5505,
            lng: order.address.longitude || 121.0260
        },
        contact: {
            name: order.user.name,
            phone: order.address.phone || order.user.phone
        }
    };

    // Delivery: Store's Address
    const storeAddress = order.store.addresses.find(a => a.isDefault) || order.store.addresses[0];
    const delivery = {
        address: storeAddress ? `${storeAddress.detailedAddress}, ${storeAddress.barangay}, ${storeAddress.city}` : order.store.address,
        coordinates: {
            lat: storeAddress?.latitude || order.store.latitude || 14.5505,
            lng: storeAddress?.longitude || order.store.longitude || 121.0260
        },
        contact: {
            name: order.store.name,
            phone: storeAddress?.phone || order.store.contact
        }
    };

    // 3. Call Lalamove Provider
    const lalamove = getShippingProvider('lalamove');

    // Get fresh quote for the return leg
    const quoteResponse = await getShippingQuote({
        pickup,
        delivery,
        package: { weight: 1 }, // Default for returns
        serviceType,
        provider: 'lalamove'
    });

    const quoteId = quoteResponse.quote.quoteId;
    const stops = quoteResponse.quote.stops;

    // 4. Place Booking
    const pickupPhone = formatPhone(pickup.contact.phone);
    const deliveryPhone = formatPhone(delivery.contact.phone);

    if (!pickupPhone || !deliveryPhone) {
        throw new Error('Valid phone numbers are required for return pickup and delivery.');
    }

    const bookingPayload = {
        quotationId: quoteId,
        stops,
        pickupContact: {
            name: pickup.contact.name,
            phone: pickupPhone
        },
        deliveryContact: {
            name: delivery.contact.name,
            phone: deliveryPhone
        },
        packageDetails: {
            remarks: `Return for Order ${order.id}`
        },
        metadata: {
            orderId: order.id,
            returnId: returnId,
            platform: 'budolshap',
            type: 'return'
        }
    };

    const booking = await lalamove.createOrder(bookingPayload);

    // 5. Update Return Record with Booking Info
    const shippingUpdate = {
        provider: 'lalamove',
        bookingId: booking.orderId,
        customerOrderId: booking.customerOrderId || null,
        shareLink: booking.shareLink || null,
        status: 'BOOKED',
        cost: quoteResponse.quote.price.amount,
        pickup,
        delivery,
        bookedAt: new Date().toISOString()
    };

    await prisma.return.update({
        where: { id: returnId },
        data: {
            status: 'BOOKED', // Move to BOOKED instead of SHIPPED immediately
            trackingNumber: booking.orderId,
            returnShipping: shippingUpdate
        }
    });

    // 6. Update Order Status
    // Keep order status as RETURN_APPROVED until courier actually picks up (handled by webhook)
    const currentStatus = order.status;
    const nextStatus = 'RETURN_APPROVED';
    const statusChanged = currentStatus !== nextStatus;

    if (statusChanged) {
        await prisma.order.update({
            where: { id: orderId },
            data: { status: nextStatus }
        });
    }

    // 7. Trigger Realtime Events
    try {
        if (statusChanged) {
            // Notify Buyer
            await triggerRealtimeEvent(`user-${order.userId}`, 'order-updated', {
                orderId: order.id,
                status: nextStatus,
                isPaid: order.isPaid,
                paymentStatus: order.paymentStatus,
                shipping: order.shipping
            });
        }

        // Notify Store - always notify about return booking as it's a new action
        await triggerRealtimeEvent(`store-${order.storeId}`, 'return-updated', {
            orderId: order.id,
            returnId: returnId,
            status: 'BOOKED',
            action: 'BOOK_RETURN',
            isPaid: order.isPaid,
            paymentStatus: order.paymentStatus,
            shipping: order.shipping
        });
    } catch (realtimeError) {
        console.error('[ShippingService] Failed to trigger realtime event:', realtimeError);
    }

    return {
        success: true,
        booking: shippingUpdate
    };
}

/**
 * Get shipping quote
 * @param {object} quoteData - Quote request data
 * @param {object} quoteData.pickup - Pickup location { address, coordinates }
 * @param {object} quoteData.delivery - Delivery location { address, coordinates }
 * @param {object} quoteData.package - Package details { weight, dimensions }
 * @param {string} quoteData.serviceType - Service type (e.g., 'MOTORCYCLE')
 * @param {string} quoteData.provider - Provider name (e.g., 'lalamove')
 * @param {string} quoteData.orderId - Optional order ID to store quote
 * @returns {Promise<object>} Quote details
 */
export async function getShippingQuote(quoteData) {
    const { pickup, delivery, package: packageDetails, serviceType = 'MOTORCYCLE', provider = 'lalamove', orderId } = quoteData;

    // Validate
    if (!pickup?.address || !pickup?.coordinates) {
        throw new Error('Missing pickup info');
    }
    if (!delivery?.address || !delivery?.coordinates) {
        throw new Error('Missing delivery info');
    }
    if (!packageDetails?.weight) {
        throw new Error('Missing package weight');
    }

    // Get provider
    const shippingProvider = getShippingProvider(provider);

    // Prepare data
    const stops = [
        {
            coordinates: {
                lat: pickup.coordinates.lat.toString(),
                lng: pickup.coordinates.lng.toString()
            },
            address: pickup.address
        },
        {
            coordinates: {
                lat: delivery.coordinates.lat.toString(),
                lng: delivery.coordinates.lng.toString()
            },
            address: delivery.address
        }
    ];

    const quotePayload = {
        serviceType,
        language: 'en_PH',
        stops: stops
    };

    // Get quote
    const quote = await shippingProvider.getQuote(quotePayload);

    // Store quote in database if orderId provided
    if (orderId) {
        try {
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    shipping: {
                        provider: provider,
                        quote: {
                            quotationId: quote.quotationId,
                            stops: quote.stops,
                            priceBreakdown: quote.priceBreakdown,
                            distance: quote.distance,
                            serviceType: quote.serviceType,
                            expiresAt: quote.expiresAt,
                            estimatedPickupTime: quote.estimatedPickupTime,
                            estimatedDeliveryTime: quote.estimatedDeliveryTime,
                            createdAt: new Date().toISOString()
                        }
                    }
                }
            });
        } catch (dbError) {
            console.error('[ShippingService] Failed to store quote in DB:', dbError);
            // Don't fail the request if DB update fails
        }
    }

    return {
        success: true,
        quote: {
            quoteId: quote.quotationId,
            price: {
                amount: quote.priceBreakdown.total,
                currency: quote.priceBreakdown.currency,
                breakdown: {
                    base: quote.priceBreakdown.base,
                    surcharge: quote.priceBreakdown.surcharge || 0,
                    total: quote.priceBreakdown.total
                }
            },
            distance: quote.distance,
            estimatedPickupTime: quote.estimatedPickupTime,
            estimatedDeliveryTime: quote.estimatedDeliveryTime,
            expiresAt: quote.expiresAt,
            stops: quote.stops // ✅ CRITICAL: Include stops with stopIds for order creation
        }
    };
}

/**
 * Book shipping
 * @param {object} bookingData - Booking request data
 * @param {string} bookingData.orderId - Order ID
 * @param {string} bookingData.provider - Provider name ('lalamove' or 'manual')
 * @param {object} bookingData.pickup - Pickup details
 * @param {object} bookingData.delivery - Delivery details
 * @param {object} bookingData.package - Package details
 * @param {string} bookingData.serviceType - Service type
 * @param {string} bookingData.quoteId - Quote ID (for Lalamove)
 * @param {string} bookingData.trackingNumber - Tracking number (for manual)
 * @param {string} bookingData.trackingUrl - Tracking URL (for manual)
 * @returns {Promise<object>} Booking details
 */
export async function bookShipping(bookingData) {
    const { orderId, provider = 'lalamove', pickup, delivery, package: packageDetails, serviceType, quoteId, trackingNumber, trackingUrl } = bookingData;

    if (!orderId) {
        throw new Error('Order ID is required');
    }

    // Fetch order
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            address: true,
            store: {
                include: {
                    addresses: {
                        where: { isDefault: true },
                        take: 1
                    }
                }
            },
            user: true,
            orderItems: {
                include: {
                    product: true
                }
            }
        }
    });

    if (!order) {
        throw new Error('Order not found');
    }

    // Handle manual shipping
    if (provider === 'manual') {
        if (!trackingNumber) {
            throw new Error('Tracking number is required for manual shipping');
        }

        // Check for existing active booking
        const isShippingActive = order.shipping?.bookingId &&
            !order.shipping?.failureReason &&
            !['CANCELLED', 'EXPIRED', 'REJECTED', 'COMPLETED'].includes(order.shipping?.status);

        if (isShippingActive) {
            throw new Error('Order already has an active shipping booking');
        }

        // Prepare shipping update
        const shippingUpdate = {
            provider: bookingData.provider || 'manual',
            bookingId: trackingNumber,
            trackingUrl: trackingUrl || null,
            status: 'BOOKED',
            updatedAt: new Date().toISOString(),
            bookedAt: new Date().toISOString(),
            previousAttempts: order.shipping?.previousAttempts || []
        };

        // Update order
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'PROCESSING',
                shipping: shippingUpdate
            },
            include: { user: true, store: true }
        });

        // Send email notification
        try {
            await sendOrderStatusEmail(
                updatedOrder.user.email,
                updatedOrder,
                updatedOrder.user,
                updatedOrder.store,
                'PROCESSING'
            );
        } catch (emailError) {
            console.error('[ShippingService] Failed to send email:', emailError);
        }

        return {
            success: true,
            booking: shippingUpdate
        };
    }

    // Handle Lalamove shipping
    if (provider === 'lalamove') {
        const lalamove = getShippingProvider('lalamove');

        // Check for existing active booking
        const isShippingActive = order.shipping?.bookingId &&
            !order.shipping?.failureReason &&
            !['CANCELLED', 'EXPIRED', 'REJECTED', 'COMPLETED'].includes(order.shipping?.status);

        if (isShippingActive) {
            throw new Error('Order already has an active shipping booking');
        }

        // Get or refresh quote
        let storedQuote = order.shipping?.quotationId ? {
            quotationId: order.shipping.quotationId,
            stops: order.shipping.quote?.stops || order.shipping.stops,
            expiresAt: order.shipping.quote?.expiresAt || order.shipping.expiresAt
        } : null;

        const now = new Date();
        const isQuoteExpired = storedQuote?.expiresAt && new Date(storedQuote.expiresAt) < now;
        const quoteAge = order.shipping?.updatedAt ?
            (now - new Date(order.shipping.updatedAt)) / 1000 / 60 : 999;
        const isQuoteTooOld = quoteAge > 30;
        const needsRefresh = !storedQuote || !storedQuote.quotationId || !storedQuote.stops || storedQuote.stops.length === 0 || isQuoteExpired || isQuoteTooOld;

        // If quote needs refresh, get fresh quote
        if (needsRefresh) {
            // Resolve store pickup address from structured StoreAddress or fallback to legacy address string
            const storeAddr = order.store?.addresses?.[0];
            const resolvedPickup = pickup || {
                address: storeAddr
                    ? [storeAddr.detailedAddress, storeAddr.barangay, storeAddr.city].filter(Boolean).join(', ')
                    : (order.store?.address || 'Default Address'),
                coordinates: {
                    lat: storeAddr?.latitude || order.store?.latitude || 14.5505,
                    lng: storeAddr?.longitude || order.store?.longitude || 121.0260
                },
                contact: {
                    name: order.store?.name || 'Store',
                    phone: storeAddr?.phone || order.store?.contact
                }
            };
            const freshQuote = await getShippingQuote({
                pickup: resolvedPickup,
                delivery: delivery || {
                    address: `${order.address.street}, ${order.address.city}`,
                    coordinates: {
                        lat: order.address.latitude || 14.5505,
                        lng: order.address.longitude || 121.0260
                    }
                },
                package: packageDetails || { weight: 1 },
                serviceType: serviceType || 'MOTORCYCLE',
                provider: 'lalamove',
                orderId: orderId
            });

            // Refetch order to get the fresh stops that were stored in the database
            const refreshedOrder = await prisma.order.findUnique({
                where: { id: orderId },
                select: { shipping: true }
            });

            storedQuote = {
                quotationId: freshQuote.quote.quoteId,
                stops: refreshedOrder?.shipping?.quote?.stops || refreshedOrder?.shipping?.stops || [],
                expiresAt: freshQuote.quote.expiresAt
            };

            // Validate that we have stops
            if (!storedQuote.stops || storedQuote.stops.length === 0) {
                throw new Error('Failed to get shipping stops from quote. Please try again.');
            }
        }

        // Validate we have all required data before booking
        if (!storedQuote.quotationId) {
            throw new Error('Missing quotation ID. Please refresh the quote and try again.');
        }
        if (!storedQuote.stops || storedQuote.stops.length === 0) {
            throw new Error('Missing shipping stops. Please refresh the quote and try again.');
        }

        const storePhone = formatPhone(order.store?.phone || order.store?.contactNumber || order.user?.phone || order.address?.phone);
        const customerPhone = formatPhone(order.address?.phone || order.address?.contactNumber || order.user?.phone || order.store?.phone);

        if (!storePhone || !customerPhone) {
            throw new Error('Valid phone numbers are required for pickup and delivery contacts.');
        }

        // Build contact details with safe fallbacks
        const pickupContact = {
            name: order.store?.name || 'Store',
            phone: storePhone
        };
        const deliveryContact = {
            name: order.user?.name || order.address?.contactName || 'Customer',
            phone: customerPhone
        };

        // Basic package details placeholder (avoid shadowing destructured packageDetails)
        const bookingPackageDetails = {
            remarks: `Order ${order.id}`
        };

        // Book shipping with Lalamove
        // Note: Full implementation would include phone formatting, contact details, etc.
        // This is a simplified version
        const booking = await lalamove.createOrder({
            quotationId: storedQuote.quotationId,
            stops: storedQuote.stops,
            pickupContact,
            deliveryContact,
            packageDetails: bookingPackageDetails,
            // Additional booking details would go here
        });

        // Update order with booking details
        const currentStatus = order.status;
        const nextStatus = 'PROCESSING';
        const statusChanged = currentStatus !== nextStatus;
        const shippingStatusChanged = order.shipping?.status !== booking.status;

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                status: nextStatus,
                shipping: {
                    ...order.shipping,
                    provider: 'lalamove',
                    bookingId: booking.orderId,
                    quotationId: storedQuote.quotationId,
                    status: booking.status,
                    trackingUrl: booking.trackingUrl || null,
                    shareLink: booking.shareLink || null,
                    bookedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    // Fix: Clear failure flags so it moves out of Cancelled tab
                    failureReason: null,
                    failedAt: null,
                    cancellationReason: null,
                    cancelledAt: null
                }
            },
            include: { user: true, store: true }
        });

        // Send email notification if status changed
        if (statusChanged) {
            try {
                await sendOrderStatusEmail(
                    updatedOrder.user.email,
                    updatedOrder,
                    updatedOrder.user,
                    updatedOrder.store,
                    'PROCESSING'
                );
            } catch (emailError) {
                console.error('[ShippingService] Failed to send email:', emailError);
            }
        }

        // Trigger real-time event if anything changed
        try {
            if (statusChanged || shippingStatusChanged) {
                const eventPayload = {
                    orderId: updatedOrder.id,
                    status: updatedOrder.status,
                    shippingStatus: booking.status,
                    isPaid: updatedOrder.isPaid,
                    paymentStatus: updatedOrder.paymentStatus,
                    shipping: updatedOrder.shipping
                };

                // Notify Store
                await triggerRealtimeEvent(`store-${updatedOrder.storeId}`, 'order-updated', eventPayload);

                // Notify User (Buyer)
                await triggerRealtimeEvent(`user-${updatedOrder.userId}`, 'order-updated', eventPayload);
            }

            // Keep specific event for backwards compatibility if needed - only if new booking
            if (!order.shipping?.bookingId) {
                await triggerRealtimeEvent(`store-${updatedOrder.storeId}`, 'shipping.booked', {
                    orderId: updatedOrder.id,
                    bookingId: booking.orderId,
                    status: booking.status,
                    isPaid: updatedOrder.isPaid,
                    paymentStatus: updatedOrder.paymentStatus,
                    shipping: updatedOrder.shipping
                });
            }
        } catch (realtimeError) {
            console.error('[ShippingService] Failed to trigger realtime event:', realtimeError);
        }

        return {
            success: true,
            booking: {
                orderId: updatedOrder.id,
                bookingId: booking.orderId,
                status: booking.status,
                trackingUrl: booking.trackingUrl,
                shareLink: booking.shareLink
            }
        };
    }

    throw new Error(`Unsupported shipping provider: ${provider}`);
}

/**
 * Track shipping
 * @param {string} orderId - Order ID
 * @returns {Promise<object>} Tracking information
 */
export async function trackShipping(orderId) {
    if (!orderId) {
        throw new Error('Order ID is required');
    }

    // Get order
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
            id: true,
            shipping: true,
            userId: true
        }
    });

    if (!order) {
        throw new Error('Order not found');
    }

    // Check if order has shipping
    if (!order.shipping?.provider || order.shipping.provider !== 'lalamove') {
        throw new Error('Order does not have Lalamove shipping');
    }

    if (!order.shipping.bookingId) {
        throw new Error('Order does not have a booking ID');
    }

    // Get provider
    const shippingFactory = require('@/services/shippingFactory');
    const { getShippingProvider } = shippingFactory;
    const lalamove = getShippingProvider('lalamove');

    // Track order
    const trackingInfo = await lalamove.trackOrder(order.shipping.bookingId);

    // Update order with latest tracking info
    const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
            shipping: {
                ...order.shipping,
                status: trackingInfo.status,
                driver: trackingInfo.driverInfo || null,
                location: trackingInfo.location || null,
                updatedAt: new Date().toISOString(),
                // Fix: Clear failure flags if status is valid (not failed)
                // This allows "Sync" to fix orders stuck in "Cancelled" tab after rebooking
                failureReason: ['CANCELLED', 'REJECTED', 'EXPIRED'].includes(trackingInfo.status) ? order.shipping.failureReason : null,
                failedAt: ['CANCELLED', 'REJECTED', 'EXPIRED'].includes(trackingInfo.status) ? order.shipping.failedAt : null,
                cancellationReason: ['CANCELLED', 'REJECTED', 'EXPIRED'].includes(trackingInfo.status) ? order.shipping.cancellationReason : null,
                cancelledAt: ['CANCELLED', 'REJECTED', 'EXPIRED'].includes(trackingInfo.status) ? order.shipping.cancelledAt : null
            }
        },
        include: { store: true, user: true }
    });

    // Trigger Realtime for UI Sync
    try {
        const eventPayload = {
            orderId: updatedOrder.id,
            status: updatedOrder.status,
            shippingStatus: trackingInfo.status,
            isPaid: updatedOrder.isPaid,
            paymentStatus: updatedOrder.paymentStatus,
            shipping: updatedOrder.shipping
        };

        await Promise.all([
            triggerRealtimeEvent(`store-${updatedOrder.storeId}`, 'order-updated', eventPayload),
            triggerRealtimeEvent(`user-${updatedOrder.userId}`, 'order-updated', eventPayload)
        ]);
    } catch (realtimeError) {
        console.error('[ShippingService] Failed to trigger realtime event in trackShipping:', realtimeError);
    }

    return {
        success: true,
        tracking: {
            orderId: order.id,
            bookingId: order.shipping.bookingId,
            status: trackingInfo.status,
            statusText: getStatusText(trackingInfo.status),
            trackingUrl: order.shipping.trackingUrl,
            driver: trackingInfo.driverInfo || null,
            location: trackingInfo.location || null,
            timeline: trackingInfo.timeline || [],
            estimatedDeliveryTime: trackingInfo.estimatedDeliveryTime,
            actualDeliveryTime: trackingInfo.actualDeliveryTime
        }
    };
}

/**
 * Cancel shipping
 * @param {string} orderId - Order ID
 * @returns {Promise<object>} Cancellation details
 */
export async function cancelShipping(orderId) {
    if (!orderId) {
        throw new Error('Order ID is required');
    }

    // Get order
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
            id: true,
            shipping: true,
            userId: true
        }
    });

    if (!order) {
        throw new Error('Order not found');
    }

    // Check if order has shipping
    if (!order.shipping?.provider || order.shipping.provider !== 'lalamove') {
        throw new Error('Order does not have Lalamove shipping');
    }

    if (!order.shipping.bookingId) {
        throw new Error('Order does not have a booking ID');
    }

    // Check if order is already cancelled or completed
    const nonCancellableStatuses = ['COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED'];
    if (nonCancellableStatuses.includes(order.shipping.status)) {
        throw new Error(`Cannot cancel order - already ${order.shipping.status.toLowerCase()}`);
    }

    // Get provider
    const shippingFactory = require('@/services/shippingFactory');
    const { getShippingProvider } = shippingFactory;
    const lalamove = getShippingProvider('lalamove');

    // Cancel order
    await lalamove.cancelOrder(order.shipping.bookingId);

    // Update order with cancellation info
    await prisma.order.update({
        where: { id: orderId },
        data: {
            status: 'PROCESSING',
            shipping: {
                ...order.shipping,
                status: 'CANCELLED',
                cancelledAt: new Date().toISOString(),
                cancellationReason: 'Cancelled by user',
                failureReason: 'CANCELLED_BY_SELLER',
                failedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                previousAttempts: [
                    ...(order.shipping.previousAttempts || []),
                    {
                        bookingId: order.shipping.bookingId,
                        failureReason: 'CANCELLED_BY_SELLER',
                        failedAt: new Date().toISOString(),
                        status: 'INVALID'
                    }
                ]
            }
        }
    });

    return {
        success: true,
        cancellation: {
            orderId: order.id,
            bookingId: order.shipping.bookingId,
            status: 'CANCELLED',
            message: 'Delivery order cancelled successfully',
            cancelledAt: new Date().toISOString()
        }
    };
}

/**
 * Update shipping status (for webhooks)
 * @param {string} orderId - Order ID
 * @param {object} statusData - Status update data
 * @returns {Promise<object>} Updated order
 */
export async function updateShippingStatus(orderId, statusData) {
    const order = await prisma.order.findUnique({
        where: { id: orderId }
    });

    if (!order) {
        throw new Error('Order not found');
    }

    // Update shipping status
    const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
            shipping: {
                ...order.shipping,
                ...statusData,
                updatedAt: new Date().toISOString()
            }
        },
        include: { store: true, user: true }
    });

    // Trigger Realtime for UI Sync
    try {
        const eventPayload = {
            orderId: updatedOrder.id,
            status: updatedOrder.status,
            shippingStatus: statusData.status || updatedOrder.shipping?.status,
            isPaid: updatedOrder.isPaid,
            paymentStatus: updatedOrder.paymentStatus,
            shipping: updatedOrder.shipping
        };

        await Promise.all([
            triggerRealtimeEvent(`store-${updatedOrder.storeId}`, 'order-updated', eventPayload),
            triggerRealtimeEvent(`user-${updatedOrder.userId}`, 'order-updated', eventPayload)
        ]);
    } catch (realtimeError) {
        console.error('[ShippingService] Failed to trigger realtime event in updateShippingStatus:', realtimeError);
    }

    return updatedOrder;
}

/**
 * Helper function to convert status codes to readable text
 */
function getStatusText(status) {
    const statusMap = {
        'ASSIGNING_DRIVER': 'Looking for a driver',
        'ON_GOING': 'Driver assigned',
        'PICKED_UP': 'Package picked up',
        'IN_TRANSIT': 'In transit',
        'COMPLETED': 'Delivered',
        'CANCELLED': 'Cancelled',
        'REJECTED': 'Rejected',
        'EXPIRED': 'Expired'
    };

    return statusMap[status] || status;
}

/**
 * BudolShap Shipping Flow - Arrange Shipment
 * Allows seller to select shipment model (PICKUP/DROPOFF)
 * @param {string} orderId - Order ID
 * @param {string} shipmentModel - Shipment model (PICKUP/DROPOFF)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Arrangement result
 */
export async function arrangeShipment(orderId, shipmentModel, options = {}) {
    // Validate inputs
    if (!orderId) {
        throw new Error('Order ID is required');
    }

    if (!Object.values(SHIPMENT_MODELS).includes(shipmentModel)) {
        throw new Error(`Invalid shipment model. Must be one of: ${Object.values(SHIPMENT_MODELS).join(', ')}`);
    }

    // Get order
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            store: true,
            user: true
        }
    });

    if (!order) {
        throw new Error('Order not found');
    }

    // Check if BudolShap shipping is enabled
    const settings = await prisma.systemSettings.findUnique({
        where: { id: 'default' }
    });

    if (!isBudolShapShippingEnabledServer(settings)) {
        throw new Error('BudolShap shipping flow is not enabled');
    }

    // Initialize or update shipping data using contract
    let shippingData = order.shipping || {};

    // Update with new arrangement
    shippingData = updateShippingStatusContract(shippingData, SHIPPING_STATUS.ARRANGED, {
        shipmentModel,
        arrangedBy: options.userId || 'system'
    });

    // Set provider if not set (indicates using BudolShap-aligned flow)
    if (!shippingData.provider) {
        shippingData.provider = SHIPPING_PROVIDERS.BUDOLSHAP;
    }

    // Add shipment model
    shippingData.shipmentModel = shipmentModel;

    // Calculate ship-by deadline if not already set
    if (!shippingData.shipByAt) {
        const slaDays = getBudolShapShippingSLADaysServer(settings);
        const shipByDate = new Date(order.createdAt);
        shipByDate.setDate(shipByDate.getDate() + slaDays);
        shippingData.shipByAt = shipByDate.toISOString();
    }

    // Validate against contract
    const validation = validateShippingData(shippingData);
    if (!validation.isValid) {
        throw new Error(`Invalid shipping data: ${validation.errors.join(', ')}`);
    }

    // Update order
    const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
            shipping: shippingData
        },
        include: { user: true, store: true }
    });

    // Trigger real-time event if anything changed
    try {
        const hasModelChanged = order.shipping?.shipmentModel !== shipmentModel;
        const hasStatusChanged = order.shipping?.status !== shippingData.status;

        if (hasModelChanged || hasStatusChanged) {
            await triggerRealtimeEvent(`store-${updatedOrder.storeId}`, 'shipping.arranged', {
                orderId: updatedOrder.id,
                shipmentModel,
                shipByAt: shippingData.shipByAt,
                isPaid: updatedOrder.isPaid,
                paymentStatus: updatedOrder.paymentStatus,
                shipping: updatedOrder.shipping
            });

            // Also trigger order-updated to ensure tab sync
            await triggerRealtimeEvent(`store-${updatedOrder.storeId}`, 'order-updated', {
                orderId: updatedOrder.id,
                status: updatedOrder.status,
                isPaid: updatedOrder.isPaid,
                paymentStatus: updatedOrder.paymentStatus,
                shipping: updatedOrder.shipping
            });
        }
    } catch (realtimeError) {
        console.error('[ShippingService] Failed to trigger realtime event:', realtimeError);
    }

    return {
        success: true,
        shipping: shippingData,
        message: 'Shipment arranged successfully'
    };
}

/**
 * Generate shipping documents (waybill, packing list)
 * Phase 3 implementation
 * @param {string} orderId - Order ID
 * @param {Object} options - Document generation options
 * @returns {Promise<Object>} Document URLs
 */
export async function generateShippingDocuments(orderId, options = {}) {
    // Validate inputs
    if (!orderId) {
        throw new Error('Order ID is required');
    }

    // Get order
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            store: true,
            user: true,
            orderItems: {
                include: {
                    product: true
                }
            }
        }
    });

    if (!order) {
        throw new Error('Order not found');
    }

    // Check if waybill generation is enabled
    const settings = await prisma.systemSettings.findUnique({
        where: { id: 'default' }
    });

    if (!isBudolShapShippingEnabledServer(settings) || !settings?.budolShapWaybillGeneration) {
        throw new Error('Waybill generation is not enabled');
    }

    // Validate shipping status
    if (!order.shipping || order.shipping.status !== SHIPPING_STATUS.ARRANGED) {
        throw new Error('Order must be arranged before generating documents');
    }

    // TODO: Implement actual PDF generation in Phase 3
    // For now, return placeholder URLs
    const documentUrls = {
        waybillPdfUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/shipping/waybill/${orderId}`,
        packingListPdfUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/shipping/documents/${orderId}/packing-list`,
        combinedPdfUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/shipping/documents/${orderId}/combined`
    };

    // Update order with document URLs
    const updatedShipping = {
        ...order.shipping,
        documents: documentUrls
    };

    await prisma.order.update({
        where: { id: orderId },
        data: {
            shipping: updatedShipping
        }
    });

    return {
        success: true,
        documents: documentUrls,
        message: 'Shipping documents generated successfully'
    };
}

/**
 * Get orders that need shipping arrangement (for seller dashboard)
 * @param {string} storeId - Store ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Orders needing arrangement
 */
export async function getOrdersNeedingArrangement(storeId, options = {}) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    if (!storeId) {
        throw new Error('Store ID is required');
    }

    // Check if BudolShap shipping is enabled
    const settings = await prisma.systemSettings.findUnique({
        where: { id: 'default' }
    });

    if (!isBudolShapShippingEnabledServer(settings)) {
        // Fallback to existing logic
        return await getOrdersNeedingBooking(storeId, options);
    }

    // Get orders that need arrangement
    const orders = await prisma.order.findMany({
        where: {
            storeId,
            status: { in: ['PAID', 'PROCESSING'] }, // Orders that are paid or processing but not yet arranged
            OR: [
                { shipping: null }, // No shipping data
                { shipping: { status: SHIPPING_STATUS.NEEDS_ARRANGEMENT } }, // Needs arrangement
                { shipping: { status: SHIPPING_STATUS.FAILED } } // Previous attempt failed
            ]
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true
                }
            },
            address: true,
            orderItems: {
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            images: true,
                            price: true
                        }
                    }
                }
            }
        },
        orderBy: {
            createdAt: 'asc' // Oldest first (most urgent)
        },
        take: limit,
        skip: skip
    });

    return orders;
}

/**
 * Get orders that need booking (legacy function for backward compatibility)
 * @param {string} storeId - Store ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Orders needing booking
 */
async function getOrdersNeedingBooking(storeId, options = {}) {
    const orders = await prisma.order.findMany({
        where: {
            storeId,
            status: { in: ['PAID', 'PROCESSING'] },
            OR: [
                { shipping: null },
                { shipping: { path: ['status'], equals: 'CANCELLED' } },
                { shipping: { path: ['status'], equals: 'FAILED' } },
                { shipping: { path: ['status'], equals: 'EXPIRED' } }
            ]
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true
                }
            },
            address: true,
            orderItems: {
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            images: true,
                            price: true
                        }
                    }
                }
            }
        },
        orderBy: {
            createdAt: 'asc'
        },
        take: options.limit || 50
    });

    return orders;
}
