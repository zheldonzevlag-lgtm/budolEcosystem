import ShippingProvider from './shippingProvider.js';
import axios from 'axios';
import crypto from 'crypto';

/**
 * Lalamove Shipping Provider Implementation
 * API Documentation: https://developers.lalamove.com
 * Authentication: HMAC SHA256 signature
 */
export default class Lalamove extends ShippingProvider {
    constructor() {
        super();
        this.apiKey = process.env.LALAMOVE_CLIENT_ID;
        this.apiSecret = process.env.LALAMOVE_CLIENT_SECRET;
        this.webhookSecret = process.env.LALAMOVE_WEBHOOK_SECRET;
        this.env = process.env.LALAMOVE_ENV || 'sandbox';

        console.log('[Lalamove Service] Initialized with:', {
            apiKey: this.apiKey ? '***' + this.apiKey.slice(-4) : 'MISSING',
            apiSecret: this.apiSecret ? 'PRESENT' : 'MISSING',
            env: this.env
        });

        // Validate credentials
        if (!this.apiKey || !this.apiSecret) {
            console.warn('[Lalamove Service] WARNING: Missing API credentials! Lalamove shipping will not work.');
        }

        // API Base URLs
        this.baseUrl = this.env === 'production'
            ? 'https://rest.lalamove.com'
            : 'https://rest.sandbox.lalamove.com';

        // Market and region
        this.market = 'PH'; // Philippines (Verified working in Sandbox)
        this.region = 'PH_MNL'; // Manila
    }

    /**
     * Generate HMAC SHA256 signature for API request
     */
    generateSignature(method, path, timestamp, body = '') {
        // Check if credentials are available
        if (!this.apiKey || !this.apiSecret) {
            throw new Error('Lalamove API credentials are not configured. Please set LALAMOVE_CLIENT_ID and LALAMOVE_CLIENT_SECRET environment variables.');
        }

        // Use String.fromCharCode to generate actual CRLF (CR=13, LF=10)
        const CRLF = String.fromCharCode(13, 10);
        const rawSignature = timestamp + CRLF + method + CRLF + path + CRLF + CRLF + body;
        const signature = crypto
            .createHmac('sha256', this.apiSecret)
            .update(rawSignature)
            .digest('hex');
        return signature;
    }

    /**
     * Make authenticated API request
     */
    async apiRequest(method, path, data = null) {
        const timestamp = new Date().getTime().toString();
        const body = data ? JSON.stringify(data) : '';
        const signature = this.generateSignature(method, path, timestamp, body);

        try {
            const config = {
                method,
                url: `${this.baseUrl}${path}`,
                headers: {
                    'Authorization': `hmac ${this.apiKey}:${timestamp}:${signature}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Market': this.market,
                    'Request-ID': crypto.randomUUID()  // ✅ Required by Lalamove API v3
                }
            };

            if (data) {
                config.data = data;
            }

            // Detailed logging
            console.log('[Lalamove API] Request Details:');
            console.log('  URL:', config.url);
            console.log('  Market Header:', this.market);
            console.log('  Method:', method);
            console.log('  Payload:', JSON.stringify(data, null, 2));

            const response = await axios(config);
            return response.data;
        } catch (error) {
            console.error(`Lalamove API error (${method} ${path}):`, error.response?.data || error.message);

            // Handle network/server errors (502, 503, etc.)
            if (error.response?.status >= 500 && error.response?.status < 600) {
                const serverError = new Error('Lalamove service is temporarily unavailable. Please try again in a few minutes.');
                serverError.code = 'LALAMOVE_SERVER_ERROR';
                serverError.originalError = error.response?.data;
                throw serverError;
            }

            throw this.handleApiError(error);
        }
    }

    /**
     * Handle and map Lalamove API errors to user-friendly messages
     */
    handleApiError(error) {
        const responseData = error.response?.data;
        let errorCode, errorMessage;

        // Handle Lalamove V3 error format: { errors: [{ id: 'ERR_CODE', message: '...' }] }
        if (responseData?.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
            errorCode = responseData.errors[0].id;
            errorMessage = responseData.errors[0].message;
        } else if (responseData?.error) {
            // Handle legacy or alternative format
            errorCode = responseData.error.code;
            errorMessage = responseData.error.message;
        } else {
            // Fallback
            errorCode = responseData?.message || 'UNKNOWN_ERROR';
            errorMessage = responseData?.message || error.message;
        }

        const errorMap = {
            'ERR_NO_DRIVER': 'No drivers available at this time. Please try again later.',
            'ERR_INVALID_ADDRESS': 'Invalid delivery address. Please check and try again.',
            'ERR_OUTSIDE_SERVICE_AREA': 'Delivery address is outside our service area.',
            'ERR_QUOTA_EXCEEDED': 'Service temporarily unavailable. Please try again in a few minutes.',
            'ERR_INVALID_QUOTE': 'Quote has expired. Please request a new quote.',
            'ERR_CANCELLATION_NOT_ALLOWED': 'Order cannot be cancelled at this stage.',
            'ERR_INSUFFICIENT_CREDIT': 'Insufficient credit in shipping account. Please contact support.',
            'UNAUTHORIZED': 'Invalid API credentials. Please check your API key and secret.',
            'ERR_INVALID_PHONE_NUMBER': 'Invalid phone number provided. Please check contact details.',
            'ERR_INVALID_SCHEDULE_TIME': 'Invalid schedule time. The delivery must be scheduled at least 15 minutes in the future.'
        };

        const friendlyMessage = errorMap[errorCode] || errorMessage || 'Shipping service error. Please try again.';

        const err = new Error(friendlyMessage);
        err.code = errorCode;
        err.originalError = responseData;
        return err;
    }

    /**
     * Get a shipping quote
     */
    async getQuote(payload) {
        console.log('[Lalamove Service] getQuote called');
        console.log('[Lalamove Service] this constructor:', this.constructor.name);
        console.log('[Lalamove Service] Type of apiRequest:', typeof this.apiRequest);

        let quoteData;

        // Check if payload is already formatted for Lalamove API (has 'stops')
        if (payload.stops && Array.isArray(payload.stops)) {
            quoteData = { data: payload };
        } else {
            // Format payload from generic structure
            const {
                pickupAddress,
                pickupLat,
                pickupLng,
                deliveryAddress,
                deliveryLat,
                deliveryLng,
                serviceType = 'MOTORCYCLE'
            } = payload;

            quoteData = {
                data: {
                    serviceType: serviceType,
                    stops: [
                        {
                            coordinates: {
                                lat: pickupLat.toString(),
                                lng: pickupLng.toString()
                            },
                            address: pickupAddress
                        },
                        {
                            coordinates: {
                                lat: deliveryLat.toString(),
                                lng: deliveryLng.toString()
                            },
                            address: deliveryAddress
                        }
                    ],
                    language: 'en_PH'
                }
            };
        }

        console.log('[Lalamove Service] Sending API request to /v3/quotations:', JSON.stringify(quoteData, null, 2));

        try {
            const result = await this.apiRequest('POST', `/v3/quotations`, quoteData);
            console.log('[Lalamove Service] Quote received:', JSON.stringify(result, null, 2));

            // Extract ETAs from stops if top-level fields are missing
            const stops = result.data.stops || [];
            let pickupEta = result.data.estimatedPickupTime || (stops[0] ? stops[0].eta : null);
            let deliveryEta = result.data.estimatedDeliveryTime || (stops[stops.length - 1] ? stops[stops.length - 1].eta : null);

            // Calculate estimated delivery time if not provided
            // Use scheduleAt as base and add estimated delivery duration
            if (!deliveryEta && result.data.scheduleAt) {
                const scheduleTime = new Date(result.data.scheduleAt);
                const distanceInKm = result.data.distance?.value ? result.data.distance.value / 1000 : 5;

                // Estimate delivery time based on distance
                // Assume average speed of 20 km/h in city traffic + 10 min pickup time
                const estimatedMinutes = Math.ceil((distanceInKm / 20) * 60) + 10;

                deliveryEta = new Date(scheduleTime.getTime() + estimatedMinutes * 60000).toISOString();
                pickupEta = pickupEta || scheduleTime.toISOString();
            }

            return {
                quotationId: result.data.quotationId,
                priceBreakdown: result.data.priceBreakdown,
                distance: result.data.distance,
                serviceType: result.data.serviceType,
                estimatedPickupTime: pickupEta,
                estimatedDeliveryTime: deliveryEta,
                expiresAt: result.data.expiresAt,
                scheduleAt: result.data.scheduleAt,
                isManualReview: result.data.isManualReview || false,
                stops: result.data.stops || []  // ✅ CRITICAL: Include stops with stopIds for order creation
            };
        } catch (error) {
            console.error('[Lalamove Service] getQuote failed:', error);
            throw error;
        }
    }


    /**
     * Create a delivery order
     * CRITICAL: Must receive stops array from quote response with actual stopIds
     */
    async createOrder(payload) {
        const {
            quotationId,
            stops,  // ✅ CRITICAL: stops array from quote response
            pickupContact,
            deliveryContact,
            packageDetails,
            metadata
        } = payload;

        // ✅ Validate that we have stops data
        if (!stops || !Array.isArray(stops) || stops.length < 2) {
            const error = new Error('Quote stops data is required. Must include stopIds from quote response.');
            console.error('[Lalamove Service] createOrder validation failed:', error.message);
            console.error('[Lalamove Service] Received payload:', JSON.stringify(payload, null, 2));
            throw error;
        }

        // ✅ Validate stopIds exist
        if (!stops[0]?.stopId || !stops[1]?.stopId) {
            const error = new Error('Invalid stops data. stopId missing from quote response.');
            console.error('[Lalamove Service] createOrder validation failed:', error.message);
            console.error('[Lalamove Service] stops[0]:', stops[0]);
            console.error('[Lalamove Service] stops[1]:', stops[1]);
            throw error;
        }

        console.log('[Lalamove Service] Creating order with stopIds:', {
            pickup: stops[0].stopId,
            delivery: stops[1].stopId,
            quotationId: quotationId
        });


        const orderData = {
            data: {
                quotationId: quotationId,
                sender: {
                    stopId: stops[0].stopId,  // ✅ CORRECT: From quote response
                    name: pickupContact.name,
                    phone: pickupContact.phone
                },
                recipients: [
                    {
                        stopId: stops[1].stopId,  // ✅ CORRECT: From quote response
                        name: deliveryContact.name,
                        phone: deliveryContact.phone,
                        remarks: packageDetails?.remarks || ''
                    }
                ],
                isPODEnabled: false,
                metadata: metadata || {}
            }
        };

        console.log('[Lalamove Service] Order payload:', JSON.stringify(orderData, null, 2));

        const result = await this.apiRequest('POST', `/v3/orders`, orderData);

        console.log('[Lalamove Service] Order created successfully:', {
            orderId: result.data.orderId,
            status: result.data.status
        });

        return {
            orderId: result.data.orderId,
            quotationId: result.data.quotationId,
            status: result.data.status,
            shareLink: result.data.shareLink,
            priceBreakdown: result.data.priceBreakdown,
            distance: result.data.distance,
            stops: result.data.stops,
            driverId: result.data.driverId || null
        };
    }

    /**
     * Track an existing order
     */
    async trackOrder(orderId) {
        console.log(`[Lalamove Service] tracking order: ${orderId}`);
        const result = await this.apiRequest('GET', `/v3/orders/${orderId}`);

        const orderData = result.data || {};
        const driver = orderData.driver || null;

        return {
            orderId: orderData.orderId,
            status: orderData.status,
            shareLink: orderData.shareLink,
            driverId: orderData.driverId || null,
            driverInfo: driver ? {
                name: driver.name || null,
                phone: driver.phone || null,
                plateNumber: driver.plateNumber || null,
                photo: driver.photo || null
            } : null,
            location: orderData.location ? {
                lat: orderData.location.lat,
                lng: orderData.location.lng
            } : null
        };
    }

    /**
     * Cancel an order
     */
    async cancelOrder(orderId, reason = 'Customer requested cancellation') {
        const path = `/v3/orders/${orderId}`;
        const data = {
            data: {
                reason: reason
            }
        };

        try {
            const result = await this.apiRequest('DELETE', path, data);
            return {
                canceled: true,
                message: 'Order cancelled successfully',
                data: result.data
            };
        } catch (error) {
            return {
                canceled: false,
                message: error.message
            };
        }
    }

    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(payload, signature) {
        const hmac = crypto.createHmac('sha256', this.webhookSecret);
        const content = typeof payload === 'string' ? payload : JSON.stringify(payload);
        const expectedSignature = hmac.update(content).digest('hex');
        return signature === expectedSignature;
    }

    /**
     * Test API connection (for debugging)
     */
    async testConnection() {
        try {
            // Try a simple API call to verify credentials
            const timestamp = new Date().getTime().toString();
            const path = '/v3/cities';
            const signature = this.generateSignature('GET', path, timestamp);

            const response = await axios.get(`${this.baseUrl}${path}`, {
                headers: {
                    'Authorization': `hmac ${this.apiKey}:${timestamp}:${signature}`,
                    'Accept': 'application/json',
                    'Market': this.market
                }
            });

            return {
                success: true,
                message: 'API connection successful',
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || error.message,
                error: error.response?.data
            };
        }
    }
}
