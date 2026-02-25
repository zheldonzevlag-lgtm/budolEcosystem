/**
 * Budol Ecosystem Compliance & Access Control Utility
 * Enforces KYC-based restrictions across the platform.
 */

export const KYC_TIERS = {
    UNVERIFIED: 'UNVERIFIED',
    PENDING: 'PENDING',
    VERIFIED: 'VERIFIED'
};

export const RESTRICTIONS = {
    MAX_TRANSACTION_UNVERIFIED: 10000, // PHP
    MAX_WALLET_LIMIT_VERIFIED: 100000, // PHP
    WITHDRAWAL_ALLOWED: [KYC_TIERS.VERIFIED],
    SELLER_ONBOARDING_ALLOWED: [KYC_TIERS.VERIFIED],
    P2P_TRANSFER_ALLOWED: [KYC_TIERS.VERIFIED],
};

/**
 * Checks if a user has permission to perform an action based on KYC status
 * @param {string} status - Current user KYC status
 * @param {string} action - Action being attempted
 * @returns {boolean}
 */
export function canPerformAction(status, action) {
    if (!status) status = KYC_TIERS.UNVERIFIED;

    switch (action) {
        case 'WITHDRAW':
            return RESTRICTIONS.WITHDRAWAL_ALLOWED.includes(status);
        case 'ONBOARD_SELLER':
            return RESTRICTIONS.SELLER_ONBOARDING_ALLOWED.includes(status);
        case 'P2P_TRANSFER':
            return RESTRICTIONS.P2P_TRANSFER_ALLOWED.includes(status);
        case 'HIGH_VALUE_PURCHASE':
            return status === KYC_TIERS.VERIFIED;
        default:
            return true;
    }
}

/**
 * Validates a transaction amount against KYC limits
 * @param {string} status - Current user KYC status
 * @param {number} amount - Transaction amount in PHP
 * @returns {object} { allowed: boolean, reason: string|null }
 */
export function validateTransactionLimit(status, amount) {
    if (status !== KYC_TIERS.VERIFIED && amount > RESTRICTIONS.MAX_TRANSACTION_UNVERIFIED) {
        return {
            allowed: false,
            reason: `Transaction exceeds limit of ₱${RESTRICTIONS.MAX_TRANSACTION_UNVERIFIED.toLocaleString()} for unverified accounts. Please complete KYC.`
        };
    }
    return { allowed: true, reason: null };
}

/**
 * PII Masking Helper for NPC Compliance
 * Shared across the ecosystem for consistent data privacy.
 * 
 * @param {string} str - The string to mask
 * @param {string} type - 'AUTO' | 'EMAIL' | 'PHONE' | 'NAME'
 * @returns {string} Masked string
 */
export const maskPII = (str, type = 'AUTO') => {
    if (!str) return 'N/A';
    
    if (type === 'AUTO') {
        if (str.includes('@')) type = 'EMAIL';
        else if (/\d/.test(str) && str.length >= 7) type = 'PHONE';
        else type = 'NAME';
    }

    if (type === 'EMAIL') {
        const [user, domain] = str.split('@');
        return `${user.charAt(0)}${'*'.repeat(Math.max(0, user.length - 1))}@${domain}`;
    }

    if (type === 'PHONE') {
        // Remove non-digits for length check
        const digits = str.replace(/\D/g, '');
        if (digits.length >= 10) {
            // Keep first 3 (e.g., 091) and last 3
            return `${digits.substring(0, 3)}${'*'.repeat(Math.max(0, digits.length - 6))}${digits.slice(-3)}`;
        }
        // Fallback for short numbers
        return '***' + digits.slice(-3);
    }

    if (type === 'NAME') {
        // First char visible, rest masked
        return `${str.charAt(0)}${'*'.repeat(Math.max(0, str.length - 1))}`;
    }

    return '***';
};
