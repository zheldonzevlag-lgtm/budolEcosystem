/**
 * Redis Client Utility - lib/redis.js
 *
 * WHY: The budolEcosystem AWS migration (Phase 2.3) provisions a dedicated Redis EC2 instance
 *      to serve as an in-memory cache layer. This module provides a centralized, reusable
 *      Redis client that all services (rate-limit, session, caching) can share.
 *
 * WHAT: Creates and exports a singleton Redis client that connects to the budol-redis EC2 instance
 *       at the internal VPC DNS alias (redis.budol.internal:6379). Falls back gracefully if Redis
 *       is unavailable so the app degrades without crashing.
 *
 * COMPLIANCE: PCI DSS Req 6.4 - No sensitive cardholder data is stored in Redis. Only
 *             session tokens, rate-limit counters, and transient cache keys are stored.
 *
 * TODO: Phase 5 - Migrate rate-limit.js from DB-backed to Redis-backed for better performance
 * TODO: Phase 5 - Add Redis AUTH password once configured on the EC2 instance
 * TODO: Phase 5 - Evaluate transition to AWS ElastiCache for managed Redis
 */

import { createClient } from 'redis';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Redis connection URL.
 * In production (AWS), this resolves via Route 53 to 10.0.11.31 (budol-redis EC2).
 * In development, falls back to localhost:6379.
 */
const REDIS_URL = process.env.REDIS_URL || 'redis://redis.budol.internal:6379';

/**
 * Reconnect retry strategy.
 * Cap at 10 retries with exponential backoff before giving up.
 */
const MAX_RETRY_ATTEMPTS = 10;
const RETRY_BASE_DELAY_MS = 500; // doubles each retry up to ~30 seconds

// ---------------------------------------------------------------------------
// Singleton Client Creation
// ---------------------------------------------------------------------------

let redisClient = null;
let isConnected = false;

/**
 * Creates and returns a singleton Redis client.
 * Lazy-initialized on first call.
 *
 * WHY singleton: Prevents connection pool exhaustion from multiple module imports.
 *
 * @returns {import('redis').RedisClientType} - The connected (or connecting) Redis client
 */
export function getRedisClient() {
    if (redisClient) return redisClient;

    redisClient = createClient({
        url: REDIS_URL,
        socket: {
            // Reconnect with exponential backoff
            reconnectStrategy: (retries) => {
                if (retries >= MAX_RETRY_ATTEMPTS) {
                    console.error(`[Redis] Max retry attempts (${MAX_RETRY_ATTEMPTS}) reached. Giving up.`);
                    return new Error('Redis max retries exceeded');
                }
                const delay = Math.min(RETRY_BASE_DELAY_MS * Math.pow(2, retries), 30000);
                console.warn(`[Redis] Reconnecting in ${delay}ms (attempt ${retries + 1})...`);
                return delay;
            },
            connectTimeout: 10000, // 10 second connection timeout
        }
    });

    // Event listeners for observability
    redisClient.on('connect', () => {
        console.log(`[Redis] ✅ Connected to ${REDIS_URL}`);
        isConnected = true;
    });

    redisClient.on('error', (err) => {
        console.error(`[Redis] ❌ Error: ${err.message}`);
        isConnected = false;
    });

    redisClient.on('end', () => {
        console.warn('[Redis] Connection closed.');
        isConnected = false;
    });

    // Connect asynchronously - errors handled by the 'error' listener above
    redisClient.connect().catch((err) => {
        console.error('[Redis] Initial connection failed:', err.message);
    });

    return redisClient;
}

/**
 * Check if Redis is currently connected and healthy.
 * Used for health check endpoints.
 *
 * @returns {boolean} - true if Redis is connected
 */
export function isRedisConnected() {
    return isConnected && redisClient !== null;
}

// ---------------------------------------------------------------------------
// Cache Helpers
// ---------------------------------------------------------------------------

/**
 * Set a value in Redis with an optional TTL.
 *
 * WHY: Centralized helper to ensure consistent serialization (JSON.stringify)
 *      and TTL enforcement across all cache usage.
 *
 * @param {string} key - Cache key
 * @param {*} value - Value to store (will be JSON serialized)
 * @param {number} [ttlSeconds=3600] - Time-to-live in seconds (default: 1 hour)
 * @returns {Promise<boolean>} - true on success, false if Redis unavailable
 */
export async function cacheSet(key, value, ttlSeconds = 3600) {
    if (!isRedisConnected()) return false;
    try {
        const client = getRedisClient();
        await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
        return true;
    } catch (err) {
        console.error(`[Redis] cacheSet failed for key "${key}":`, err.message);
        return false;
    }
}

/**
 * Get a value from Redis cache.
 *
 * @param {string} key - Cache key
 * @returns {Promise<*|null>} - Parsed value or null if not found / unavailable
 */
export async function cacheGet(key) {
    if (!isRedisConnected()) return null;
    try {
        const client = getRedisClient();
        const raw = await client.get(key);
        if (raw === null) return null;
        return JSON.parse(raw);
    } catch (err) {
        console.error(`[Redis] cacheGet failed for key "${key}":`, err.message);
        return null;
    }
}

/**
 * Delete a value from Redis cache.
 *
 * @param {string} key - Cache key to delete
 * @returns {Promise<boolean>} - true if deleted, false otherwise
 */
export async function cacheDel(key) {
    if (!isRedisConnected()) return false;
    try {
        const client = getRedisClient();
        await client.del(key);
        return true;
    } catch (err) {
        console.error(`[Redis] cacheDel failed for key "${key}":`, err.message);
        return false;
    }
}

// ---------------------------------------------------------------------------
// Rate Limit Helpers (Redis-backed)
// ---------------------------------------------------------------------------

/**
 * Redis-backed rate limit check.
 *
 * WHY: Replaces the DB-backed rate limiter in rate-limit.js for high-frequency operations
 *      (e.g. OTP requests, login attempts). Redis atomic INCR is ~1000x faster than a DB
 *      transaction and doesn't risk locking the Prisma connection pool.
 *
 * HOW: Uses Redis INCR + EXPIRE for atomic, lock-free counting.
 *
 * @param {string} key - Rate limit key (e.g. "rl:login:127.0.0.1")
 * @param {number} limit - Maximum allowed requests
 * @param {number} windowSeconds - Time window in seconds
 * @returns {Promise<{success: boolean, remaining: number, ttl: number}|null>}
 *          Returns null if Redis is unavailable (caller should fall back to DB rate limiter)
 */
export async function redisRateLimit(key, limit, windowSeconds) {
    if (!isRedisConnected()) return null; // Graceful fallback signal
    try {
        const client = getRedisClient();
        const rlKey = `rl:${key}`;

        // Atomic increment + set expiry only on first request
        const count = await client.incr(rlKey);
        if (count === 1) {
            // First request in this window, set TTL
            await client.expire(rlKey, windowSeconds);
        }

        const ttl = await client.ttl(rlKey);
        return {
            success: count <= limit,
            remaining: Math.max(0, limit - count),
            ttl: ttl > 0 ? ttl : windowSeconds,
        };
    } catch (err) {
        console.error(`[Redis] redisRateLimit error for key "${key}":`, err.message);
        return null; // Fall back to DB rate limiter
    }
}

// ---------------------------------------------------------------------------
// Shutdown Hook
// ---------------------------------------------------------------------------

/**
 * Gracefully disconnect the Redis client on process exit.
 * WHY: Prevents lingering connections that could cause memory leaks in Lambda/Fargate.
 */
export async function disconnectRedis() {
    if (redisClient && isConnected) {
        await redisClient.quit();
        isConnected = false;
        console.log('[Redis] Disconnected gracefully.');
    }
}
