// Phone number normalization utility for Budol Ecosystem
// Ensures all phone numbers are stored in E.164 format (+639XXXXXXXXX)

/**
 * Normalizes a phone number to E.164 format
 * @param {string} phone - The phone number to normalize
 * @returns {string|null} - Normalized phone number or null if invalid
 */
function normalizePhilippinePhone(phone) {
  if (!phone) return null;
  
  // Remove all non-digit characters
  let digits = phone.replace(/[^0-9]/g, '');
  
  // Handle different formats
  if (digits.startsWith('0')) {
    // Local format: 09XXXXXXXXX -> +639XXXXXXXXX
    digits = '63' + digits.substring(1);
  } else if (digits.startsWith('63') && digits.length === 11) {
    // Already in 63 format
    // Do nothing
  } else if (digits.startsWith('9') && digits.length === 10) {
    // Assume Philippine number without country code
    digits = '63' + digits;
  } else if (digits.startsWith('9') && digits.length === 11) {
    // Full number without + prefix
    digits = '6' + digits;
  }
  
  // Validate final format (should be 63 followed by 10 digits)
  if (/^63[0-9]{10}$/.test(digits)) {
    return '+' + digits;
  }
  
  return null;
}

/**
 * Validates if a phone number is in correct E.164 format
 * @param {string} phone - The phone number to validate
 * @returns {boolean} - True if valid E.164 format
 */
function isValidE164Phone(phone) {
  if (!phone) return false;
  return /^\+63[0-9]{10}$/.test(phone);
}

/**
 * Formats a phone number for display
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