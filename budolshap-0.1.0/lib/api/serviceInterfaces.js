/**
 * Service Interfaces / API Contracts
 * Defines the expected request/response formats for each service
 * Used for documentation and validation
 */

/**
 * System Service Interface
 */
export const SystemServiceInterface = {
    /**
     * GET /api/internal/system/health
     * @returns {Promise<{status: string, service: string, timestamp: string, checks: object}>}
     */
    health: {
        method: 'GET',
        path: '/health',
        response: {
            status: 'healthy' | 'unhealthy',
            service: 'system',
            timestamp: 'string',
            checks: {
                database: 'string'
            }
        }
    },
    
    /**
     * GET /api/internal/system/settings
     * @returns {Promise<SystemSettings>}
     */
    getSettings: {
        method: 'GET',
        path: '/settings',
        response: {
            id: 'string',
            realtimeProvider: 'POLLING' | 'PUSHER' | 'SOCKET_IO',
            pusherKey: 'string | null',
            pusherCluster: 'string | null',
            pusherAppId: 'string | null',
            pusherSecret: 'string | null',
            socketUrl: 'string | null',
            sessionTimeout: 'number',
            sessionWarning: 'number',
            loginLimit: 'number',
            registerLimit: 'number'
        }
    },
    
    /**
     * PUT /api/internal/system/settings
     * @param {Partial<SystemSettings>} data
     * @returns {Promise<SystemSettings>}
     */
    updateSettings: {
        method: 'PUT',
        path: '/settings',
        request: {
            realtimeProvider: 'POLLING' | 'PUSHER' | 'SOCKET_IO',
            pusherKey: 'string',
            pusherCluster: 'string',
            pusherAppId: 'string',
            pusherSecret: 'string',
            socketUrl: 'string',
            sessionTimeout: 'number',
            sessionWarning: 'number',
            loginLimit: 'number',
            registerLimit: 'number'
        },
        response: {
            // Same as getSettings response
        }
    },
    
    /**
     * GET /api/internal/system/realtime
     * @returns {Promise<RealtimeConfig>}
     */
    getRealtimeConfig: {
        method: 'GET',
        path: '/realtime',
        response: {
            provider: 'POLLING' | 'PUSHER' | 'SOCKET_IO',
            pusherKey: 'string | null',
            pusherCluster: 'string | null',
            socketUrl: 'string | null'
        }
    }
};

/**
 * Common Error Response Format
 */
export const ErrorResponse = {
    error: 'string',
    statusCode: 'number',
    details: 'object | null'
};

/**
 * Payment Service Interface
 */
export const PaymentServiceInterface = {
    /**
     * GET /api/internal/payment/health
     * @returns {Promise<{status: string, service: string, timestamp: string, checks: object}>}
     */
    health: {
        method: 'GET',
        path: '/health',
        response: {
            status: 'healthy' | 'degraded' | 'unhealthy',
            service: 'payment',
            timestamp: 'string',
            checks: {
                paymentService: 'string',
                paymongo: 'string'
            }
        }
    },
    
    /**
     * POST /api/internal/payment/checkout
     * @param {object} data - Payment checkout data
     * @returns {Promise<{checkoutUrl: string, paymentIntentId: string}>}
     */
    checkout: {
        method: 'POST',
        path: '/checkout',
        request: {
            amount: 'number',
            method: 'string',
            provider: 'string',
            billing: 'object',
            description: 'string',
            orderId: 'number',
            successUrl: 'string',
            cancelUrl: 'string'
        },
        response: {
            checkoutUrl: 'string',
            paymentIntentId: 'string'
        }
    },
    
    /**
     * GET /api/internal/payment/status?paymentIntentId=xxx
     * @returns {Promise<PaymentStatus>}
     */
    getStatus: {
        method: 'GET',
        path: '/status',
        response: {
            paymentIntentId: 'string',
            status: 'string',
            orderId: 'number',
            amount: 'number',
            isPaid: 'boolean'
        }
    }
};

/**
 * Shipping Service Interface
 */
export const ShippingServiceInterface = {
    /**
     * GET /api/internal/shipping/health
     * @returns {Promise<{status: string, service: string, timestamp: string, checks: object}>}
     */
    health: {
        method: 'GET',
        path: '/health',
        response: {
            status: 'healthy' | 'degraded' | 'unhealthy',
            service: 'shipping',
            timestamp: 'string',
            checks: {
                database: 'string',
                shippingFactory: 'string'
            }
        }
    },
    
    /**
     * POST /api/internal/shipping/quote
     * @param {object} data - Quote request data
     * @returns {Promise<{success: boolean, quote: object}>}
     */
    quote: {
        method: 'POST',
        path: '/quote',
        request: {
            pickup: 'object',
            delivery: 'object',
            package: 'object',
            serviceType: 'string',
            provider: 'string',
            orderId: 'string'
        },
        response: {
            success: 'boolean',
            quote: 'object'
        }
    },
    
    /**
     * POST /api/internal/shipping/book
     * @param {object} data - Booking request data
     * @returns {Promise<{success: boolean, booking: object}>}
     */
    book: {
        method: 'POST',
        path: '/book',
        request: {
            orderId: 'string',
            provider: 'string',
            pickup: 'object',
            delivery: 'object',
            package: 'object',
            trackingNumber: 'string',
            trackingUrl: 'string'
        },
        response: {
            success: 'boolean',
            booking: 'object'
        }
    },
    
    /**
     * GET /api/internal/shipping/track/[orderId]
     * @returns {Promise<{success: boolean, tracking: object}>}
     */
    track: {
        method: 'GET',
        path: '/track/[orderId]',
        response: {
            success: 'boolean',
            tracking: 'object'
        }
    },
    
    /**
     * POST /api/internal/shipping/cancel/[orderId]
     * @returns {Promise<{success: boolean, cancellation: object}>}
     */
    cancel: {
        method: 'POST',
        path: '/cancel/[orderId]',
        response: {
            success: 'boolean',
            cancellation: 'object'
        }
    }
};

/**
 * Auth Service Interface
 */
export const AuthServiceInterface = {
    health: {
        method: 'GET',
        path: '/health',
        response: {
            status: 'healthy' | 'unhealthy',
            service: 'auth',
            timestamp: 'string',
            checks: {
                database: 'string'
            }
        }
    },
    register: {
        method: 'POST',
        path: '/register',
        request: {
            name: 'string',
            email: 'string',
            password: 'string',
            accountType: 'string'
        },
        response: {
            message: 'string',
            user: 'object'
        }
    },
    login: {
        method: 'POST',
        path: '/login',
        request: {
            email: 'string',
            password: 'string'
        },
        response: {
            message: 'string',
            user: 'object'
        }
    },
    getUser: {
        method: 'GET',
        path: '/user/[userId]',
        response: {
            id: 'string',
            name: 'string',
            email: 'string',
            accountType: 'string',
            emailVerified: 'boolean',
            isAdmin: 'boolean'
        }
    }
};

/**
 * Cache Service Interface
 */
export const CacheServiceInterface = {
    health: {
        method: 'GET',
        path: '/health',
        response: {
            status: 'healthy' | 'degraded' | 'unhealthy',
            service: 'cache',
            timestamp: 'string',
            checks: {
                provider: 'string',
                connection: 'string',
                message: 'string'
            }
        }
    }
};

/**
 * Error Tracking Service Interface
 */
export const ErrorTrackingServiceInterface = {
    health: {
        method: 'GET',
        path: '/health',
        response: {
            status: 'healthy' | 'degraded' | 'disabled' | 'unhealthy',
            service: 'error-tracking',
            timestamp: 'string',
            checks: {
                enabled: 'boolean',
                configured: 'boolean',
                message: 'string'
            }
        }
    }
};

/**
 * Service Interface Registry
 * Maps service names to their interfaces
 */
export const ServiceInterfaces = {
    system: SystemServiceInterface,
    payment: PaymentServiceInterface,
    shipping: ShippingServiceInterface,
    auth: AuthServiceInterface,
    cache: CacheServiceInterface,
    errorTracking: ErrorTrackingServiceInterface,
    // Add other services as they're implemented
    // orders: OrdersServiceInterface,
    // catalog: CatalogServiceInterface,
    // admin: AdminServiceInterface,
};

