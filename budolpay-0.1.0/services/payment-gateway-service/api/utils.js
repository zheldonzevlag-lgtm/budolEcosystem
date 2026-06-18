const crypto = require('crypto');

/**
 * Date Utilities for Asia/Manila Standard
 */
const getLegacyManilaISO = () => new Date().toISOString();
const getLegacyManilaDate = () => new Date();

/**
 * Generate a secure, unique reference ID for transactions
 * Format: JON-YYYYMMDDHHMMSS-RANDOM (8 chars)
 */
function generateSecureReferenceId() {
  const timestamp = getLegacyManilaISO()
    .replace(/[-T:.Z]/g, '') // Remove separators
    .slice(0, 14); // Keep YYYYMMDDHHMMSS
  
  const randomBytes = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `JON-${timestamp}-${randomBytes}`;
}

module.exports = {
  getLegacyManilaISO,
  getLegacyManilaDate,
  generateSecureReferenceId
};
