/**
 * Payment Service
 * Service layer for payment operations
 * Phase 3: Extracted as independent service boundary
 */

import { paymentService as paymentServiceInstance } from '@/lib/payment/service';
import { prisma } from '@/lib/prisma';

/**
 * Initiate a payment flow
 * @param {object} params - Payment parameters
 * @param {number} params.amount - Amount in centavos
 * @param {string} params.currency - Currency code (e.g., 'PHP')
 * @param {string} params.method - Payment method (e.g., 'gcash', 'paymaya')
 * @param {string} params.provider - Payment provider (e.g., 'paymongo')
 * @param {object} params.billing - Billing information
 * @param {object} params.options - Additional options (successUrl, cancelUrl, description)
 * @returns {Promise<object>} - { checkoutUrl, paymentIntentId }
 */
export async function initiatePayment({ amount, currency, method, provider = 'paymongo', billing, options = {} }) {
    // Robust amount validation
    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error('Valid amount (in centavos) is required');
    }

    if (!method) {
        throw new Error('Payment method is required');
    }

    // COD is an immediate payment method that doesn't require payment gateway
    if (method === 'COD' || method === 'cod') {
        throw new Error(`${method} is an immediate payment method and cannot be processed through payment gateway`);
    }

    // Normalize payment method
    let safeMethod = method;
    let safeProvider = provider;

    if (method === 'MAYA') safeMethod = 'paymaya';
    else if (method === 'GRAB_PAY') safeMethod = 'grab_pay';
    else if (method === 'QRPH') safeMethod = 'qrph';
    else if (method === 'BUDOL_PAY' || method === 'budolpay' || method === 'budol_pay') {
        safeMethod = 'budolpay';
        safeProvider = 'budolpay';
    } else safeMethod = method.toLowerCase();

    // Call payment service
    const result = await paymentServiceInstance.initiatePayment(
        safeProvider,
        amount,
        currency || 'PHP',
        safeMethod,
        billing,
        options
    );

    return result;
}

/**
 * Link payment intent to order
 * @param {number} orderId - Order ID
 * @param {string} paymentIntentId - Payment Intent ID
 * @returns {Promise<object>} Updated order
 */
export async function linkPaymentToOrder(orderId, paymentIntentId) {
    try {
        const order = await prisma.order.update({
            where: { id: orderId },
            data: {
                paymentId: paymentIntentId,
                paymentStatus: 'awaiting_payment'
            }
        });
        return order;
    } catch (error) {
        console.error('[PaymentService] Failed to link payment to order:', error);
        throw error;
    }
}

/**
 * Link payment intent to master checkout
 * @param {string} checkoutId - Checkout ID
 * @param {string} paymentIntentId - Payment Intent ID
 * @param {string} provider - Payment Provider
 * @returns {Promise<object>} Updated checkout
 */
export async function linkPaymentToCheckout(checkoutId, paymentIntentId, provider) {
    try {
        const checkout = await prisma.checkout.update({
            where: { id: checkoutId },
            data: {
                paymentId: paymentIntentId,
                paymentProvider: provider,
                status: 'PENDING'
            }
        });
        return checkout;
    } catch (error) {
        console.error('[PaymentService] Failed to link payment to checkout:', error);
        throw error;
    }
}

/**
 * Get payment status
 * @param {string} paymentIntentId - Payment Intent ID
 * @returns {Promise<object>} Payment status
 */
export async function getPaymentStatus(paymentIntentId) {
    // This would typically call the payment provider API
    // For now, we'll check the order status
    const order = await prisma.order.findFirst({
        where: { paymentId: paymentIntentId }
    });

    if (!order) {
        throw new Error('Payment not found');
    }

    return {
        paymentIntentId,
        status: order.paymentStatus || 'unknown',
        orderId: order.id,
        amount: order.total,
        isPaid: order.isPaid
    };
}

/**
 * Verify payment webhook signature
 * @param {string} rawBody - Raw request body
 * @param {string} signature - Webhook signature
 * @returns {boolean} True if signature is valid
 */
export async function verifyWebhookSignature(rawBody, signature) {
    const { verifyWebhookSignature: verify } = await import('@/lib/paymongo');
    return verify(rawBody, signature);
}

/**
 * Process payment webhook event
 * @param {object} event - Webhook event data
 * @returns {Promise<object>} Processing result
 */
export async function processWebhookEvent(event) {
    // This function will be called by the webhook handler
    // It processes payment events and updates orders accordingly
    const eventType = event.data?.attributes?.type;
    const eventData = event.data?.attributes?.data;

    console.log('[PaymentService] Processing webhook event:', eventType);

    // Return event type and data for handler to process
    return {
        eventType,
        eventData,
        processed: true
    };
}
