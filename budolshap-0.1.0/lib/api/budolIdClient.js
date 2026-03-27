/**
 * budolID Client
 * Specialized client for communicating with the budolID SSO service
 */

const BUDOL_ID_URL = process.env.BUDOL_ID_URL || 
                     process.env.AUTH_SERVICE_URL || 
                     process.env.SSO_URL || 
                     process.env.NEXT_PUBLIC_SSO_URL ||
                      'http://127.0.0.1:8000';
 
 // Helper to construct URL based on service port
 const getServiceUrl = (endpoint) => {
    // endpoint should be like '/auth/login' or '/auth/register'
    
    // If connecting directly to Auth Service (usually port 8001), 
    // remove the '/auth' prefix as it's likely mounted at root
    if (BUDOL_ID_URL.includes(':8001')) {
        return `${BUDOL_ID_URL}${endpoint.replace('/auth', '')}`;
    }
    
    // Otherwise (Gateway 8080 or SSO 8000), keep the full path
    return `${BUDOL_ID_URL}${endpoint}`;
 };

 /**
  * Register a user in budolID
 * @param {object} userData - User registration data
 * @returns {Promise<object>} Result of registration
 */
export async function registerWithBudolId(userData) {
    const { 
        email, 
        password, 
        firstName, 
        lastName, 
        phoneNumber, 
        registrationIp, 
        deviceFingerprint,
        profilePicture,
        registrationType // Pass registration type (standard or phone_only)
    } = userData;
    
    const url = getServiceUrl('/auth/register');
    console.log(`[budolID Client] Registering user at ${url}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password,
                firstName,
                lastName,
                phoneNumber,
                registrationIp,
                deviceFingerprint,
                profilePicture,
                registrationType
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `budolID registration failed: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('[budolID Client] Registration Error:', error);
        throw error;
    }
}

/**
 * Login a user in budolID
 * @param {string} identifier - Email or Phone
 * @param {string} password - Password
 * @returns {Promise<object>} Result of login
 */
export async function loginWithBudolId(identifier, password) {
    const url = getServiceUrl('/auth/login');
    try {
        console.log(`[budolID Client] Logging in user ${identifier} at ${url}`);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: identifier, // The API might accept 'email' field for both email/phone identifier
                password
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.warn(`[budolID Client] Login failed with status ${response.status}:`, errorData);
            throw new Error(errorData.error || `budolID login failed: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('[budolID Client] Login Error:', error);
        throw error;
    }
}

/**
 * Update user trust status in budolID
 * @param {string} userId - budolID user ID
 * @param {object} statusData - Trust status data (kycStatus, kybStatus, etc.)
 * @returns {Promise<object>} Result of update
 */
export async function updateTrustStatus(userId, statusData) {
    const url = getServiceUrl(`/users/${userId}/trust`);
    try {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(statusData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `budolID trust update failed: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('[budolID Client] Trust Update Error:', error);
        throw error;
    }
}

/**
 * Update user profile in budolID
 * @param {string} userId - budolID user ID
 * @param {object} profileData - Profile data (firstName, lastName, avatarUrl)
 * @returns {Promise<object>} Result of update
 */
export async function updateUserProfile(userId, profileData) {
    try {
        const response = await fetch(`${BUDOL_ID_URL}/users/${userId}/profile`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(profileData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `budolID profile update failed: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('[budolID Client] Profile Update Error:', error);
        throw error;
    }
}

/**
 * Get user details from budolID
 * @param {string} userId - budolID user ID
 * @returns {Promise<object>} User details
 */
export async function getUserById(userId) {
    try {
        // Try to fetch from the public profile or user endpoint
        const response = await fetch(`${BUDOL_ID_URL}/users/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            // If direct ID lookup fails, we might not have permission or endpoint might differ.
            // But let's assume standard REST pattern first.
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `budolID user fetch failed: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('[budolID Client] Get User Error:', error);
        throw error;
    }
}

