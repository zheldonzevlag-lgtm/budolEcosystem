/**
 * Budol Ecosystem Phone Normalization Utility
 * Standardizes phone numbers to E.164 format (+639XXXXXXXXX)
 * Compliance: NPC (Data Privacy), BSP (Financial Standard)
 */

/**
 * Normalizes a phone number string to Philippine standard format (+63)
 * @param {string} phone - The raw phone number input
 * @returns {string} - The normalized phone number or empty string if invalid
 */
export const normalizePhone = (phone) => {
    if (!phone) return '';
    
    // Remove all non-numeric characters
    const digits = phone.trim().replace(/[^0-9]/g, '');
    
    // Handle 0XXXXXXXXXX format (standard local input, 10 or 11 digits)
    if (digits.startsWith('0') && (digits.length === 11 || digits.length === 10)) {
        return '+63' + digits.substring(1);
    }
    
    // Handle 639XXXXXXXXX format (without +)
    if (digits.startsWith('63') && digits.length === 12) {
        return '+' + digits;
    }
    
    // Handle 9XXXXXXXXX format (without prefix)
    if (digits.startsWith('9') && digits.length === 10) {
        return '+63' + digits;
    }
    
    // Handle already prefixed +639XXXXXXXXX (will be digits only 639...)
    if (digits.startsWith('63') && digits.length === 12) {
        return '+' + digits;
    }

    // Default fallback for other 10-digit numbers (assume PH)
    if (digits.length === 10) {
        return '+63' + digits;
    }

    // If it already looks like a normalized number but lacks +, add it
    if (digits.startsWith('63') && digits.length >= 10) {
        return '+' + digits;
    }

    // For everything else, if it's at least 10 digits, try to prefix it
    if (digits.length >= 10) {
        // Strip any existing 63 if it's double-prefixed
        const cleanDigits = digits.replace(/^63/, '');
        return '+63' + cleanDigits.slice(-10);
    }

    return '';
};

/**
 * Validates if a string is a valid Philippine mobile number
 * @param {string} phone 
 * @returns {boolean}
 */
export const isValidPHPhone = (phone) => {
    const normalized = normalizePhone(phone);
    return /^\+639\d{9}$/.test(normalized);
};

/**
 * Formats phone for display (e.g., 0917 654 3281)
 * @param {string} phone 
 * @returns {string}
 */
export const formatPhoneForDisplay = (phone) => {
    const digits = phone.replace(/[^0-9]/g, '');
    const last10 = digits.slice(-10);
    if (last10.length === 10) {
        return `0${last10.substring(0, 3)} ${last10.substring(3, 6)} ${last10.substring(6)}`;
    }
    return phone;
};
