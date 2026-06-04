/**
 * Enhanced Session Management
 * Secure session handling with rotation and cleanup
 */

import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { getNowUTC } from './dateUtils'
import { createAuditLog } from './audit'

const SESSION_MAX_AGE_HOURS = 24
const SESSION_MAX_CONCURRENT = 3

/**
 * Create a new session for user
 */
export async function createSession(userId, request) {
    const now = getNowUTC()
    const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE_HOURS * 60 * 60 * 1000)
    const sessionId = generateSessionId()
    
    // Get IP address
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] 
        || request.headers.get('x-real-ip') 
        || 'unknown'
    
    // Get user agent
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Create session record
    await prisma.session.create({
        data: {
            id: sessionId,
            userId,
            expiresAt,
            ip,
            userAgent,
            isActive: true
        }
    })
    
    // Clean up old sessions for this user
    await cleanupOldSessions(userId)
    
    return sessionId
}

/**
 * Validate and refresh session
 */
export async function validateSession(sessionId) {
    if (!sessionId) return { valid: false, reason: 'No session' }
    
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: { select: { id: true, isActive: true } } }
    })
    
    if (!session) return { valid: false, reason: 'Session not found' }
    if (!session.isActive) return { valid: false, reason: 'Session inactive' }
    if (!session.user?.isActive) return { valid: false, reason: 'User inactive' }
    
    const now = getNowUTC()
    if (new Date(session.expiresAt) < now) {
        // Session expired - deactivate
        await prisma.session.update({
            where: { id: sessionId },
            data: { isActive: false }
        })
        return { valid: false, reason: 'Session expired' }
    }
    
    return { valid: true, userId: session.userId }
}

/**
 * Invalidate all sessions for a user (logout everywhere)
 */
export async function invalidateAllSessions(userId, request) {
    await prisma.session.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false }
    })
    
    await createAuditLog(userId, 'ALL_SESSIONS_INVALIDATED', request, {
        reason: 'User logged out from all devices'
    })
}

/**
 * Invalidate a specific session
 */
export async function invalidateSession(sessionId, userId) {
    await prisma.session.update({
        where: { id: sessionId },
        data: { isActive: false }
    })
}

/**
 * Clean up old sessions for a user (keep only recent ones)
 */
async function cleanupOldSessions(userId) {
    // Get all active sessions for user, ordered by creation
    const sessions = await prisma.session.findMany({
        where: { userId, isActive: true },
        orderBy: { createdAt: 'desc' },
        take: SESSION_MAX_CONCURRENT + 1 // Get one extra to check
    })
    
    // If over limit, deactivate oldest ones
    if (sessions.length > SESSION_MAX_CONCURRENT) {
        const toDeactivate = sessions.slice(SESSION_MAX_CONCURRENT)
        for (const session of toDeactivate) {
            await prisma.session.update({
                where: { id: session.id },
                data: { isActive: false, reason: 'Exceeded concurrent session limit' }
            })
        }
    }
    
    // Clean up expired sessions (older than max age)
    const cutoff = new Date(getNowUTC().getTime() - SESSION_MAX_AGE_HOURS * 60 * 60 * 1000)
    await prisma.session.updateMany({
        where: { 
            userId,
            expiresAt: { lt: cutoff }
        },
        data: { isActive: false }
    })
}

/**
 * Generate secure session ID
 */
function generateSessionId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let id = ''
    for (let i = 0; i < 64; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return id
}

/**
 * Get active session count for a user
 */
export async function getActiveSessionCount(userId) {
    return await prisma.session.count({
        where: { userId, isActive: true }
    })
}