/**
 * Phone Normalization Utility for Budol Ecosystem
 * WHY: All services must store/compare Philippine phone numbers in a consistent
 *      E.164 format (+639XXXXXXXXX) to prevent duplicate registrations and
 *      ensure cross-service identity lookup works correctly.
 *      This file was missing from the repo, causing a startup crash on Vercel.
 * WHAT: Provides three functions:
 *   - normalizePhilippinePhone: Converts any PH format to +63XXXXXXXXXX
 *   - isValidE164Phone: Validates a number is in correct E.164 format
 *   - formatPhoneForDisplay: Renders a number in human-friendly format
 * TODO: Extend to support non-PH numbers if ecosystem expands internationally.
 */

/**
 * Normalizes a Philippine phone number to E.164 format (+639XXXXXXXXX)
 * Handles: 09XXXXXXXXX, +639XXXXXXXXX, 639XXXXXXXXX, 9XXXXXXXXX
 * @param {string} phone - The phone number to normalize
 * @returns {string|null} - Normalized phone number or null if invalid
 */
function normalizePhilippinePhone(phone) {
    if (!phone) return null;

    // Remove all non-digit characters (spaces, dashes, parentheses, +)
    let digits = phone.replace(/[^0-9]/g, '');

    // Handle different Philippine phone formats:
    if (digits.startsWith('0') && digits.length === 11) {
        // Local format: 09XXXXXXXXX -> 639XXXXXXXXX
        digits = '63' + digits.substring(1);
    } else if (digits.startsWith('63') && digits.length === 12) {
        // Already in 63XXXXXXXXXX format — no change needed
    } else if (digits.startsWith('9') && digits.length === 10) {
        // Assume Philippine number without country code: 9XXXXXXXXX -> 639XXXXXXXXX
        digits = '63' + digits;
    } else if (digits.startsWith('9') && digits.length === 11) {
        // Full number without + prefix: 639XXXXXXXXX -> straighten out
        digits = '6' + digits;
    }

    // Validate: must be 63 followed by exactly 10 digits
    if (/^63[0-9]{10}$/.test(digits)) {
        return '+' + digits;
    }

    // Cannot normalize — return null so callers can reject invalid input
    return null;
}

/**
 * Validates if a phone number is in correct E.164 format for PH
 * @param {string} phone - The phone number to validate
 * @returns {boolean} - True if valid +63XXXXXXXXXX format
 */
function isValidE164Phone(phone) {
    if (!phone) return false;
    return /^\+63[0-9]{10}$/.test(phone);
}

/**
 * Formats a phone number for human-readable display
 * Example: +639123456789 -> +63 912 345 6789
 * @param {string} phone - The phone number in E.164 format
 * @returns {string} - Formatted phone number for display
 */
function formatPhoneForDisplay(phone) {
    if (!phone || !isValidE164Phone(phone)) return phone;

    // +639XXXXXXXXX -> +63 9XX XXX XXXX
    const match = phone.match(/^(\+63)([0-9]{3})([0-9]{3})([0-9]{4})$/);
    if (match) {
        return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
    }

    return phone;
}

module.exports = {
    normalizePhilippinePhone,
    isValidE164Phone,
    formatPhoneForDisplay
};
