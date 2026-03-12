import { prisma } from './prisma.js';
import { UAParser } from 'ua-parser-js';
import { triggerRealtimeEvent } from './realtime.js';
import crypto from 'crypto';

/**
 * Creates an audit log entry for user actions.
 * @param {string|null} userId - The ID of the user (or null for system/anonymous actions).
 * @param {string} action - The action performed (e.g., 'LOGIN', 'ORDER_CREATED').
 * @param {Request} request - The Next.js request object to extract headers.
 * @param {Object} [options] - Additional metadata for the log.
 * @param {string} [options.entity] - The type of entity affected (e.g., 'Order', 'Product').
 * @param {string} [options.entityId] - The ID of the entity.
 * @param {string} [options.details] - Human-readable details about the event.
 * @param {string} [options.status='SUCCESS'] - The outcome status ('SUCCESS', 'FAILURE', 'WARNING').
 * @param {Object} [options.metadata] - JSON metadata for extra context.
 */
export async function createAuditLog(userId, action, request, options = {}) {
    try {
        const { entity, entityId, details, status = 'SUCCESS', metadata = {} } = options;

        let ipAddress = 'Unknown';
        let userAgentString = '';
        let latitude, longitude, country, city;

        // Safe header access helper
        const getHeader = (name) => {
            if (!request || !request.headers) return null;
            if (typeof request.headers.get === 'function') {
                return request.headers.get(name);
            }
            // Handle plain object headers if passed manually
            return request.headers[name] || request.headers[name.toLowerCase()];
        };

        if (request) {
            ipAddress = getHeader('x-forwarded-for') || getHeader('x-real-ip') || 'Unknown';
            // Clean IP: x-forwarded-for can contain multiple IPs, first is the client
            if (typeof ipAddress === 'string') {
                ipAddress = ipAddress.split(',')[0].trim();
            }

            // 1. Try Vercel Headers (Fastest if on Vercel)
            latitude = getHeader('x-vercel-ip-latitude');
            longitude = getHeader('x-vercel-ip-longitude');
            country = getHeader('x-vercel-ip-country');
            city = getHeader('x-vercel-ip-city');
            userAgentString = getHeader('user-agent') || '';
        }

        // 2. Fallback: External Geolocation API (If headers missing & IP is valid/public)
        // Skip for localhost/private IPs to avoid errors
        const isPublicIp = ipAddress && ipAddress !== 'Unknown' && !ipAddress.startsWith('127.') && !ipAddress.startsWith('192.168.') && !ipAddress.startsWith('10.') && !ipAddress.startsWith('::1');

        // Trigger fallback if ANY key data is missing (City, Country, Lat, or Long)
        if ((!city || !country || !latitude || !longitude) && isPublicIp) {
            try {
                // Using ip-api.com (Free tier: 45 req/min, non-commercial use)
                // For heavy production, consider a paid service or database like GeoLite2
                const geoRes = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,country,city,lat,lon`);
                const geoData = await geoRes.json();

                if (geoData.status === 'success') {
                    country = country || geoData.country;
                    city = city || geoData.city;
                    latitude = latitude || String(geoData.lat);
                    longitude = longitude || String(geoData.lon);
                }
            } catch (err) {
                console.warn('Geolocation fallback failed:', err);
            }
        }

        // Defaults
        country = country || 'Unknown';
        city = city || 'Unknown';

        const parser = new UAParser(userAgentString);
        const result = parser.getResult();
        const device = `${result.os.name || 'Unknown OS'} ${result.os.version || ''} / ${result.browser.name || 'Unknown Browser'}`;

        // Phase 1 Enhancement: Cryptographic Hashing (Shopee-like Integrity)
        // Create a hash of the critical fields to ensure tamper-evidence
        const timestamp = new Date().toISOString();
        const hashInput = `${userId}:${action}:${entityId}:${status}:${timestamp}:${JSON.stringify(metadata)}`;
        const integrityHash = crypto.createHash('sha256').update(hashInput).digest('hex');

        // Store hash in metadata
        const enrichedMetadata = {
            ...metadata,
            integrity: {
                hash: integrityHash,
                timestamp,
                version: 'v1'
            }
        };

        const auditLog = await prisma.auditLog.create({
            data: {
                user: userId ? { connect: { id: userId } } : undefined,
                action,
                entity,
                entityId,
                details,
                status,
                metadata: enrichedMetadata,
                ipAddress,
                latitude: latitude || null,
                longitude: longitude || null,
                country,
                city,
                device,
                userAgent: userAgentString,
                createdAt: timestamp // Ensure timestamp matches hash
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });

        // Trigger Realtime Event for Admin Dashboard
        try {
            await triggerRealtimeEvent('admin', 'AUDIT_LOG_CREATED', {
                ...auditLog,
                timestamp: new Date().toISOString()
            });
        } catch (realtimeError) {
            console.error('Realtime trigger failed (non-blocking):', realtimeError);
        }

        return auditLog;

    } catch (error) {
        console.error('Failed to create audit log:', error);
        // Do not throw error to avoid blocking the main auth flow
    }
}
