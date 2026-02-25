/**
 * Service Client
 * HTTP client for service-to-service communication
 * Used in Phase 2 to prepare for microservices extraction
 */

/**
 * Get the base URL for internal service calls
 * In development: http://localhost:3000/api/internal
 * In production: Same (still internal to Vercel)
 */
function getInternalServiceBaseUrl() {
    const baseUrl = process.env.INTERNAL_SERVICE_BASE_URL || 
                   process.env.NEXT_PUBLIC_BASE_URL || 
                   'http://localhost:3000';
    
    // Remove trailing slash
    return baseUrl.replace(/\/$/, '') + '/api/internal';
}

/**
 * Get service URL for a specific service
 * @param {string} serviceName - Name of the service (e.g., 'auth', 'orders', 'payment')
 * @param {string} path - API path (e.g., '/users/me')
 * @returns {string} Full URL
 */
export function getServiceUrl(serviceName, path = '') {
    const baseUrl = getInternalServiceBaseUrl();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}/${serviceName}${cleanPath}`;
}

/**
 * Make HTTP request to internal service
 * @param {string} serviceName - Service name
 * @param {string} path - API path
 * @param {object} options - Fetch options
 * @returns {Promise<Response>}
 */
export async function callInternalService(serviceName, path, options = {}) {
    const url = getServiceUrl(serviceName, path);
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            // Add internal service header for identification
            'X-Internal-Service': 'true',
            ...options.headers,
        },
    };

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(url, mergedOptions);
        return response;
    } catch (error) {
        console.error(`[ServiceClient] Error calling ${serviceName}${path}:`, error);
        throw error;
    }
}

/**
 * Call internal service and parse JSON response
 * @param {string} serviceName - Service name
 * @param {string} path - API path
 * @param {object} options - Fetch options
 * @returns {Promise<object>} Parsed JSON response
 */
export async function callInternalServiceJson(serviceName, path, options = {}) {
    const response = await callInternalService(serviceName, path, options);
    
    if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
            errorData = JSON.parse(errorText);
        } catch {
            errorData = { error: errorText };
        }
        
        const error = new Error(errorData.error || `Service call failed: ${response.status}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
    }
    
    return await response.json();
}

/**
 * Health check for a service
 * @param {string} serviceName - Service name
 * @returns {Promise<object>} Health status
 */
export async function checkServiceHealth(serviceName) {
    try {
        const response = await callInternalService(serviceName, '/health');
        if (response.ok) {
            return await response.json();
        }
        return { status: 'unhealthy', statusCode: response.status };
    } catch (error) {
        return { status: 'unreachable', error: error.message };
    }
}

