/**
 * Account Lockout Security
 * Lock accounts after multiple failed login attempts
 */

import { prisma } from './prisma'
import { getNowUTC } from './dateUtils'
import { createAuditLog } from './audit'

const DEFAULT_MAX_FAILED_ATTEMPTS = 5
const DEFAULT_LOCKOUT_DURATION_MINUTES = 30

/**
 * Check if account is locked out
 */
export async function isAccountLocked(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            failedAttempts: true,
            lockedUntil: true,
            isActive: true
        }
    })
    
    if (!user) return { locked: false }
    
    const now = getNowUTC()
    const isLocked = user.lockedUntil && new Date(user.lockedUntil) > now
    
    return {
        locked: isLocked,
        failedAttempts: user.failedAttempts || 0,
        lockedUntil: user.lockedUntil
    }
}

/**
 * Record failed login attempt
 */
export async function recordFailedLogin(userId, request) {
    const now = getNowUTC()
    
    // Get current failed attempts
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { failedAttempts: true }
    })
    
    const failedAttempts = (user?.failedAttempts || 0) + 1
    
    // Calculate lockout until
    let lockedUntil = null
    if (failedAttempts >= DEFAULT_MAX_FAILED_ATTEMPTS) {
        lockedUntil = new Date(now.getTime() + DEFAULT_LOCKOUT_DURATION_MINUTES * 60 * 1000)
        
        // Log account lockout
        await createAuditLog(userId, 'ACCOUNT_LOCKED', request, {
            reason: 'Too many failed login attempts',
            failedAttempts,
            lockedUntil: lockedUntil.toISOString()
        })
    }
    
    // Update user record
    await prisma.user.update({
        where: { id: userId },
        data: {
            failedAttempts,
            lockedUntil
        }
    })
    
    return {
        failedAttempts,
        locked: failedAttempts >= DEFAULT_MAX_FAILED_ATTEMPTS,
        lockedUntil
    }
}

/**
 * Reset failed login attempts on successful login
 */
export async function resetFailedLogin(userId) {
    await prisma.user.update({
        where: { id: userId },
        data: {
            failedAttempts: 0,
            lockedUntil: null
        }
    })
}

/**
 * Check if login should be blocked due to account status
 */
export async function checkAccountStatus(userId, request) {
    const status = await isAccountLocked(userId)
    
    if (status.locked) {
        await createAuditLog(userId, 'LOGIN_BLOCKED', request, {
            reason: 'Account is locked',
            lockedUntil: status.lockedUntil
        })
        return {
            allowed: false,
            reason: 'Account is temporarily locked due to too many failed attempts. Try again later.'
        }
    }
    
    return { allowed: true }
}