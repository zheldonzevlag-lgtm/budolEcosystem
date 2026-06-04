import jwt from 'jsonwebtoken'

// JWT_SECRET - require environment variable in production, allow dev fallback
const JWT_SECRET = process.env.JWT_SECRET || (
    process.env.NODE_ENV === 'production'
        ? (() => { throw new Error('CRITICAL: JWT_SECRET environment variable is required in production!'); })()
        : 'dev-local-only-secret-do-not-use-in-prod'
);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

// Generate JWT token
export function generateToken(payload, expiresIn = JWT_EXPIRES_IN) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn })
}

// Verify JWT token
export function verifyToken(token) {
    try {
        if (!token) {
            console.log('[Token] No token provided to verifyToken');
            return null;
        }
        
        // Ensure secret is present
        if (!JWT_SECRET) {
            console.error('[Token] JWT_SECRET is missing!');
            return null;
        }

        const decoded = jwt.verify(token, JWT_SECRET)
        console.log(`[Token] Successfully verified token for user: ${decoded.userId || decoded.id || decoded.sub}`);
        return decoded
    } catch (error) {
        console.error(`[Token] Verification error: ${error.message}`);
        // Development-only debugging - never in production
        if (process.env.NODE_ENV !== 'production') {
            console.log('[Token] JWT_SECRET is configured');
        }
        return null
    }
}

// Generate email verification token
export function generateEmailToken() {
    return jwt.sign({ type: 'email_verify' }, JWT_SECRET, { expiresIn: '24h' })
}

// Generate password reset token
export function generateResetToken() {
    return jwt.sign({ type: 'password_reset' }, JWT_SECRET, { expiresIn: '1h' })
}

// Verify email token
export function verifyEmailToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET)
        return decoded.type === 'email_verify' ? decoded : null
    } catch (_error) {
        return null
    }
}

// Verify reset token
export function verifyResetToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET)
        return decoded.type === 'password_reset' ? decoded : null
    } catch (_error) {
        return null
    }
}

/**
 * Generate a numeric OTP for SMS/Email verification
 * @param {number} length Length of OTP (default 6)
 * @returns {string} The numeric OTP
 */
export function generateOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
}
