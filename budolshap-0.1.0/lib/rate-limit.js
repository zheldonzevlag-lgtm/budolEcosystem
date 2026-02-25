import { prisma } from './prisma';
import { getNowUTC } from './dateUtils';
import { getSystemSettings } from './settings';
import { createAuditLog } from './audit';

/**
 * Basic Database-backed Rate Limiter
 * @param {string} key - Unique identifier (e.g. "ip:127.0.0.1:login")
 * @param {number} defaultLimit - Max attempts if not configured in settings
 * @param {number} defaultWindowSeconds - Time window in seconds if not configured in settings
 * @returns {Promise<{success: boolean, remaining: number, reset: Date}>}
 */
export async function rateLimit(key, defaultLimit, defaultWindowSeconds) {
    const now = getNowUTC().getTime();
    
    // Attempt to get dynamic limits from settings
    let limit = defaultLimit;
    let windowSeconds = defaultWindowSeconds;

    try {
        const settings = await getSystemSettings();
        if (key.includes(':login') && settings.loginLimit) {
            limit = settings.loginLimit;
        } else if (key.includes(':register') && settings.registerLimit) {
            limit = settings.registerLimit;
        } else if (key.includes('otp:') && settings.loginLimit) {
            // OTP requests often follow login limits or a fraction of it
            limit = Math.max(5, Math.floor(settings.loginLimit / 2));
        }
    } catch (e) {
        // Fallback to defaults
    }

    const windowMs = windowSeconds * 1000;
    const expireAt = BigInt(now + windowMs);

    try {
        // Clean up expired entries (optional optimization, or do via cron)
        // For simple implementation, we just upsert

        // 1. Get current
        // We use a transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            let record = await tx.rateLimit.findUnique({
                where: { key }
            });

            // If no record or expired, reset
            if (!record || Number(record.expireAt) < now) {
                record = await tx.rateLimit.upsert({
                    where: { key },
                    update: { points: 1, expireAt },
                    create: { key, points: 1, expireAt }
                });
            } else {
                // Increment
                record = await tx.rateLimit.update({
                    where: { key },
                    data: { points: { increment: 1 } }
                });
            }

            return record;
        });

        const currentPoints = result.points;
        const resetTime = new Date(Number(result.expireAt));
        const success = currentPoints <= limit;

        // If rate limit exceeded, log security event
        if (!success) {
            // Only log once per window (when points == limit + 1) to avoid spamming DB
            if (currentPoints === limit + 1) {
                // Parse IP from key if possible (format: "ip:1.2.3.4:action")
                const parts = key.split(':');
                const ipAddress = parts[1] && parts[0] === 'ip' ? parts[1] : 'Unknown';
                
                // We don't have request object here easily, but we can pass null and use options
                await createAuditLog(null, 'DDOS_MITIGATED', null, {
                    entity: 'RateLimit',
                    entityId: key,
                    status: 'WARNING',
                    details: `Rate limit exceeded for ${key}. Blocked request.`,
                    metadata: {
                        limit,
                        currentPoints,
                        ip: ipAddress,
                        windowSeconds
                    }
                });
            }
        }

        return {
            success,
            remaining: Math.max(0, limit - currentPoints),
            reset: resetTime
        };

    } catch (error) {
        console.error("Rate Limit Error:", error);
        // Fail open if DB error, to not block legitimate users during outages
        return { success: true, remaining: 1, reset: new Date(Date.now() + windowMs) };
    }
}
