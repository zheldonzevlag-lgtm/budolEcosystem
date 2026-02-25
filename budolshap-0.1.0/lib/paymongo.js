import Paymongo from 'paymongo'
import crypto from 'crypto'

// Initialize PayMongo client
const paymongo = process.env.PAYMONGO_SECRET_KEY && process.env.PAYMONGO_SECRET_KEY.trim() !== '' ? new Paymongo(process.env.PAYMONGO_SECRET_KEY) : null

/**
 * Create a GCash payment source
 * @param {number} amount - Amount in centavos (e.g., 10000 = ₱100.00)
 * @param {object} billing - Billing details
 * @param {string} redirectUrl - Success/Failed redirect URL
 * @returns {Promise<object>} - Payment source object
 */
export async function createGCashSource(amount, billing, redirectUrl) {
    try {
        if (!paymongo) throw new Error('PayMongo client not initialized. Check PAYMONGO_SECRET_KEY.')
        const source = await paymongo.sources.create({
            data: {
                attributes: {
                    amount: amount, // Amount in centavos
                    redirect: {
                        success: redirectUrl.success,
                        failed: redirectUrl.failed
                    },
                    type: 'gcash',
                    currency: 'PHP',
                    billing: {
                        name: billing.name,
                        email: billing.email,
                        phone: billing.phone,
                        address: {
                            line1: billing.address.line1,
                            line2: billing.address.line2,
                            city: billing.address.city,
                            state: billing.address.state,
                            postal_code: billing.address.postal_code,
                            country: 'PH'
                        }
                    }
                }
            }
        })

        return source
    } catch (error) {
        console.error('Error creating GCash source:', error)
        throw error
    }
}

/**
 * Create a payment from a chargeable source
 * @param {string} sourceId - Source ID from webhook
 * @param {number} amount - Amount in centavos
 * @returns {Promise<object>} - Payment object
 */
export async function createPayment(sourceId, amount) {
    try {
        if (!paymongo) throw new Error('PayMongo client not initialized. Check PAYMONGO_SECRET_KEY.')
        const payment = await paymongo.payments.create({
            data: {
                attributes: {
                    amount: amount,
                    source: {
                        id: sourceId,
                        type: 'source'
                    },
                    currency: 'PHP'
                }
            }
        })

        return payment
    } catch (error) {
        console.error('Error creating payment:', error)
        throw error
    }
}

/**
 * Retrieve a payment by ID
 * @param {string} paymentId - Payment ID
 * @returns {Promise<object>} - Payment object
 */
export async function getPayment(paymentId) {
    try {
        if (!paymongo) throw new Error('PayMongo client not initialized. Check PAYMONGO_SECRET_KEY.')
        const payment = await paymongo.payments.retrieve(paymentId)
        return payment
    } catch (error) {
        console.error('Error retrieving payment:', error)
        throw error
    }
}

/**
 * Retrieve a source by ID
 * @param {string} sourceId - Source ID
 * @returns {Promise<object>} - Source object
 */
export async function getSource(sourceId) {
    try {
        if (!paymongo) throw new Error('PayMongo client not initialized. Check PAYMONGO_SECRET_KEY.')
        const source = await paymongo.sources.retrieve(sourceId)
        return source
    } catch (error) {
        console.error('Error retrieving source:', error)
        throw error
    }
}

/**
 * Verify webhook signature
 * @param {string} payload - Raw request body
 * @param {string} signature - Paymongo-Signature header
 * @returns {boolean} - True if signature is valid
 */
export function verifyWebhookSignature(payload, signature) {
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET

    if (!webhookSecret) {
        console.error('PAYMONGO_WEBHOOK_SECRET not set')
        return false
    }

    try {
        // Extract timestamp and signatures from header
        const parts = signature.split(',')
        const timestamp = parts.find(p => p.startsWith('t=')).split('=')[1]
        const signatures = parts.filter(p => p.startsWith('v1=')).map(p => p.split('=')[1])

        // Create expected signature
        const signedPayload = `${timestamp}.${payload}`
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(signedPayload)
            .digest('hex')

        // Compare signatures
        return signatures.some(sig => {
            const sigBuffer = Buffer.from(sig);
            const expectedBuffer = Buffer.from(expectedSignature);
            
            if (sigBuffer.length !== expectedBuffer.length) {
                return false;
            }
            
            return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
        })
    } catch (error) {
        console.error('Error verifying webhook signature:', error)
        return false
    }
}

export default paymongo
