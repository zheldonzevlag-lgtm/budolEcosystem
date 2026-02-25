import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc='
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
        // Log the secret being used (masked) for debugging secret mismatch
        const maskedSecret = JWT_SECRET ? `${JWT_SECRET.substring(0, 3)}...${JWT_SECRET.substring(JWT_SECRET.length - 3)}` : 'MISSING';
        console.log(`[Token] Using secret: ${maskedSecret}`);
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
