/**
 * CSRF Protection Utilities
 */

import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'

const CSRF_TOKEN_LENGTH = 32

/**
 * Generate a new CSRF token
 */
export function generateCSRFToken() {
    return randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
}

/**
 * Create a CSRF token and set as cookie
 */
export async function setCSRFCookie() {
    const token = generateCSRFToken()
    const cookieStore = await cookies()
    
    cookieStore.set('csrf-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 4 // 4 hours
    })
    
    return token
}

/**
 * Validate CSRF token from request
 */
export async function validateCSRFToken(request) {
    const cookieStore = await cookies()
    const cookieToken = cookieStore.get('csrf-token')?.value
    const headerToken = request.headers.get('x-csrf-token')
    
    // No token provided
    if (!cookieToken || !headerToken) {
        return { valid: false, reason: 'CSRF token missing' }
    }
    
    // Tokens don't match
    if (cookieToken !== headerToken) {
        return { valid: false, reason: 'CSRF token mismatch' }
    }
    
    return { valid: true }
}

/**
 * Middleware helper for CSRF validation
 */
export async function requireCSRF(request) {
    const validation = await validateCSRFToken(request)
    
    if (!validation.valid) {
        console.warn(`[CSRF] Validation failed: ${validation.reason}`)
        return false
    }
    
    return true
}