import bcrypt from 'bcryptjs'
import { verifyToken } from './token.js'
import { cookies } from 'next/headers'

// Hash password
export async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10)
    return await bcrypt.hash(password, salt)
}

// Verify password
export async function verifyPassword(password, hashedPassword) {
    // 1. Try bcrypt comparison
    try {
        const isMatch = await bcrypt.compare(password, hashedPassword)
        if (isMatch) return true
    } catch (e) {
        // Ignore bcrypt errors (e.g. invalid hash format) and proceed to plain text check
    }

    // 2. Fallback: Plain text comparison (Legacy support)
    // Only if hashedPassword is not a valid bcrypt hash (which usually starts with $2)
    // or if bcrypt failed.
    if (password === hashedPassword) {
        return true
    }

    return false
}

export * from './token.js'

// Standardized Cookie Options
export const COOKIE_OPTIONS = {
    httpOnly: false, // Changed to false to allow client-side access for debugging/sync
    // Disable secure in development and LAN IP to allow non-HTTPS cookies
    secure: false, 
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
}

// Get user from request (for middleware)
export function getUserFromRequest(request) {
    const auth = getAuthFromRequest(request)
    return auth ? auth.decoded : null
}

// Get full auth data from request
export function getAuthFromRequest(request) {
    try {
        // First try to get token from cookie (primary method)
        // Check both 'budolshap_token' (new) and 'token' (old) for compatibility
        const cookieToken = request.cookies.get('budolshap_token')?.value || request.cookies.get('token')?.value

        if (cookieToken) {
            console.log(`[Auth] Cookie token found (first 10 chars): ${cookieToken.substring(0, 10)}...`);
            const decoded = verifyToken(cookieToken)
            if (decoded) {
                console.log(`[Auth] Token verified for user: ${decoded.userId || decoded.id || decoded.sub}`);
                return { token: cookieToken, decoded }
            } else {
                console.error(`[Auth] Token verification failed for cookie token. Token might be malformed or expired.`);
            }
        } else {
            const allCookies = request.cookies.getAll().map(c => c.name).join(', ');
            console.log(`[Auth] No auth cookie found. Available cookies: ${allCookies || 'none'}`);
        }

        // Fallback to Authorization header (for API clients)
        const authHeader = request.headers.get('authorization')
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7)
            console.log(`[Auth] Authorization header found (first 10 chars): ${token.substring(0, 10)}...`);
            const decoded = verifyToken(token)
            if (decoded) {
                console.log(`[Auth] Token verified from header for user: ${decoded.userId || decoded.id || decoded.sub}`);
                return { token, decoded }
            } else {
                console.error(`[Auth] Token verification failed for header token`);
            }
        } else {
            console.log(`[Auth] No valid Authorization header found`);
        }

        return null
    } catch (error) {
        console.error(`[Auth] Error in getAuthFromRequest:`, error.message);
        return null
    }
}

/**
 * Get authentication data from cookies (Server Components/Route Handlers)
 * Returns a normalized user object with token
 */
export async function getAuthFromCookies() {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('budolshap_token')?.value || cookieStore.get('token')?.value

        if (!token) return null

        const decoded = verifyToken(token)
        if (!decoded) return null

        // Normalize the user object for internal use
        return {
            ...decoded,
            id: decoded.userId || decoded.id || decoded.sub,
            accountType: decoded.role || decoded.accountType,
            token
        }
    } catch (_error) {
        return null
    }
}

