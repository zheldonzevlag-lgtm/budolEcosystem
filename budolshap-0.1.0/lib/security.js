/**
 * Security Utilities
 * Additional input sanitization and validation
 */

import { createAuditLog } from './audit'

/**
 * Sanitize string input - prevent XSS and injection
 */
export function sanitizeInput(input) {
    if (!input || typeof input !== 'string') return ''
    
    return input
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/['"]/g, '') // Remove quotes
        .replace(/[\x00-\x1F]/g, '') // Remove control characters
        .trim()
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email) {
    if (!email) return null
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const sanitized = email.toLowerCase().trim()
    
    if (!emailRegex.test(sanitized) || sanitized.length > 254) {
        return null
    }
    
    return sanitized
}

/**
 * Validate phone number format
 */
export function sanitizePhone(phone) {
    if (!phone) return null
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '')
    
    // Validate Philippine format (11 digits starting with 09)
    if (digits.length === 11 && digits.startsWith('09')) {
        return '+' + digits
    }
    
    // Validate international format
    if (digits.length >= 10 && digits.length <= 15) {
        return '+' + digits
    }
    
    return null
}

/**
 * Check for potential SQL injection patterns
 */
export function detectSQLInjection(input) {
    if (!input || typeof input !== 'string') return false
    
    const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
        /(union\s+select)/i,
        /(\bOR\b\s+\d+\s*=\s*\d+)/i,
        /(\bAND\b\s+\d+\s*=\s*\d+)/i,
        /(--|#|\/\*|\*\/)/,
        /(0x[0-9a-fA-F]+)/ // Hex encoding attempt
    ]
    
    return sqlPatterns.some(pattern => pattern.test(input))
}

/**
 * Check for potential XSS patterns
 */
export function detectXSS(input) {
    if (!input || typeof input !== 'string') return false
    
    const xssPatterns = [
        /<script[^>]*>/i,
        /javascript:/i,
        /on\w+\s*=/i, // Event handlers like onclick=
        /<iframe/i,
        /<object/i,
        /<embed/i,
        /eval\s*\(/i,
        /expression\s*\(/i
    ]
    
    return xssPatterns.some(pattern => pattern.test(input))
}

/**
 * Detect and block common attack vectors
 */
export async function checkSecurityThreat(request, inputData = {}) {
    const threats = []
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] 
        || request.headers.get('x-real-ip') 
        || 'unknown'
    
    // Check each input field
    for (const [key, value] of Object.entries(inputData)) {
        if (typeof value !== 'string') continue
        
        if (detectSQLInjection(value)) {
            threats.push(`SQL injection detected in field: ${key}`)
            await createAuditLog(null, 'SECURITY_THREAT', request, {
                type: 'SQL_INJECTION',
                field: key,
                ip,
                status: 'BLOCKED'
            })
        }
        
        if (detectXSS(value)) {
            threats.push(`XSS detected in field: ${key}`)
            await createAuditLog(null, 'SECURITY_THREAT', request, {
                type: 'XSS',
                field: key,
                ip,
                status: 'BLOCKED'
            })
        }
    }
    
    return {
        blocked: threats.length > 0,
        threats
    }
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let token = ''
    for (let i = 0; i < length; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return token
}

/**
 * Hash sensitive data for logging
 */
export function hashForLog(data) {
    if (!data) return 'NULL'
    // Simple hash for log obfuscation (not for security)
    let hash = 0
    for (let i = 0; i < data.length; i++) {
        hash = ((hash << 5) - hash) + data.charCodeAt(i)
        hash = hash & hash
    }
    return 'HASH_' + Math.abs(hash).toString(16)
}