/**
 * Validates the current environment variables for a specific service.
 * @param {string} serviceName - The name of the service to validate.
 * @returns {boolean} - True if all required variables are present.
 */
function validateEnvironment(serviceName) {
    const required = {
        'DATABASE_URL': true,
        'NODE_ENV': true
    };

    // Service-specific requirements
    if (serviceName.includes('budolID')) {
        required['JWT_SECRET'] = true;
    } else if (serviceName.includes('budolPay')) {
        required['JWT_SECRET'] = true;
        // Gateway and services need LOCAL_IP for cross-service comms
        required['LOCAL_IP'] = true;
    }

    const missing = [];
    for (const key of Object.keys(required)) {
        if (!process.env[key]) {
            missing.push(key);
        }
    }

    if (missing.length > 0) {
        console.warn(`\x1b[33m[Validation] ${serviceName}: Missing variables: ${missing.join(', ')}\x1b[0m`);
        // We don't necessarily fail here, just warn, as some defaults might exist in code
        return false;
    }

    return true;
}

module.exports = { validateEnvironment };
