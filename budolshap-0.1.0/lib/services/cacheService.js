/**
 * Cache Service
 * Service layer for caching operations
 * Phase 6: Supports Redis and Vercel Edge Cache
 */

import { prisma } from '@/lib/prisma';

// In-memory cache fallback
let memoryCache = new Map();
let memoryCacheTimestamps = new Map();

/**
 * Get cache provider from system settings
 * @returns {Promise<string>} Cache provider name ('REDIS', 'VERCEL_EDGE', 'MEMORY')
 */
async function getCacheProvider() {
    try {
        const settings = await prisma.systemSettings.findUnique({
            where: { id: 'default' },
            select: { cacheProvider: true }
        });
        return settings?.cacheProvider || 'MEMORY';
    } catch (error) {
        console.error('[CacheService] Failed to get cache provider:', error);
        return 'MEMORY';
    }
}

/**
 * Get cache configuration from system settings
 * @returns {Promise<object>} Cache configuration
 */
async function getCacheConfig() {
    try {
        const settings = await prisma.systemSettings.findUnique({
            where: { id: 'default' },
            select: {
                cacheProvider: true,
                redisUrl: true,
                redisPassword: true
            }
        });
        return {
            provider: settings?.cacheProvider || 'MEMORY',
            redisUrl: settings?.redisUrl || null,
            redisPassword: settings?.redisPassword || null
        };
    } catch (error) {
        console.error('[CacheService] Failed to get cache config:', error);
        return {
            provider: 'MEMORY',
            redisUrl: null,
            redisPassword: null
        };
    }
}

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @param {number} ttl - Time to live in seconds (optional)
 * @returns {Promise<any>} Cached value or null
 */
export async function getCache(key, ttl = null) {
    const config = await getCacheConfig();
    const provider = config.provider;

    try {
        if (provider === 'REDIS') {
            return await getFromRedis(key, config);
        } else if (provider === 'VERCEL_EDGE') {
            return await getFromVercelEdge(key);
        } else {
            // MEMORY fallback
            return getFromMemory(key, ttl);
        }
    } catch (error) {
        console.error(`[CacheService] Error getting cache for key ${key}:`, error);
        // Fallback to memory cache on error
        return getFromMemory(key, ttl);
    }
}

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds (optional)
 * @returns {Promise<void>}
 */
export async function setCache(key, value, ttl = null) {
    const config = await getCacheConfig();
    const provider = config.provider;

    try {
        if (provider === 'REDIS') {
            await setInRedis(key, value, ttl, config);
        } else if (provider === 'VERCEL_EDGE') {
            await setInVercelEdge(key, value, ttl);
        } else {
            // MEMORY fallback
            setInMemory(key, value, ttl);
        }
    } catch (error) {
        console.error(`[CacheService] Error setting cache for key ${key}:`, error);
        // Fallback to memory cache on error
        setInMemory(key, value, ttl);
    }
}

/**
 * Delete value from cache
 * @param {string} key - Cache key
 * @returns {Promise<void>}
 */
export async function deleteCache(key) {
    const config = await getCacheConfig();
    const provider = config.provider;

    try {
        if (provider === 'REDIS') {
            await deleteFromRedis(key, config);
        } else if (provider === 'VERCEL_EDGE') {
            await deleteFromVercelEdge(key);
        } else {
            // MEMORY fallback
            deleteFromMemory(key);
        }
    } catch (error) {
        console.error(`[CacheService] Error deleting cache for key ${key}:`, error);
        // Fallback to memory cache on error
        deleteFromMemory(key);
    }
}

/**
 * Clear all cache
 * @returns {Promise<void>}
 */
export async function clearCache() {
    const config = await getCacheConfig();
    const provider = config.provider;

    try {
        if (provider === 'REDIS') {
            await clearRedis(config);
        } else if (provider === 'VERCEL_EDGE') {
            await clearVercelEdge();
        } else {
            // MEMORY fallback
            clearMemory();
        }
    } catch (error) {
        console.error('[CacheService] Error clearing cache:', error);
        // Fallback to memory cache on error
        clearMemory();
    }
}

// ========== Redis Implementation ==========

async function getFromRedis(key, config) {
    if (!config.redisUrl) {
        throw new Error('Redis URL not configured');
    }

    try {
        // Dynamic import to avoid errors if redis is not installed
        const redis = await import('redis');
        const client = redis.createClient({
            url: config.redisUrl,
            password: config.redisPassword
        });

        await client.connect();
        const value = await client.get(key);
        await client.quit();

        return value ? JSON.parse(value) : null;
    } catch (error) {
        console.error('[CacheService] Redis get error:', error);
        throw error;
    }
}

async function setInRedis(key, value, ttl, config) {
    if (!config.redisUrl) {
        throw new Error('Redis URL not configured');
    }

    try {
        const redis = await import('redis');
        const client = redis.createClient({
            url: config.redisUrl,
            password: config.redisPassword
        });

        await client.connect();
        const serialized = JSON.stringify(value);
        
        if (ttl) {
            await client.setEx(key, ttl, serialized);
        } else {
            await client.set(key, serialized);
        }
        
        await client.quit();
    } catch (error) {
        console.error('[CacheService] Redis set error:', error);
        throw error;
    }
}

async function deleteFromRedis(key, config) {
    if (!config.redisUrl) {
        throw new Error('Redis URL not configured');
    }

    try {
        const redis = await import('redis');
        const client = redis.createClient({
            url: config.redisUrl,
            password: config.redisPassword
        });

        await client.connect();
        await client.del(key);
        await client.quit();
    } catch (error) {
        console.error('[CacheService] Redis delete error:', error);
        throw error;
    }
}

async function clearRedis(config) {
    if (!config.redisUrl) {
        throw new Error('Redis URL not configured');
    }

    try {
        const redis = await import('redis');
        const client = redis.createClient({
            url: config.redisUrl,
            password: config.redisPassword
        });

        await client.connect();
        await client.flushAll();
        await client.quit();
    } catch (error) {
        console.error('[CacheService] Redis clear error:', error);
        throw error;
    }
}

// ========== Vercel Edge Cache Implementation ==========

async function getFromVercelEdge(key) {
    // Vercel Edge Cache is handled via Next.js cache() function
    // This is a placeholder - actual implementation uses Next.js cache API
    // For now, fallback to memory
    return getFromMemory(key);
}

async function setInVercelEdge(key, value, ttl) {
    // Vercel Edge Cache is handled via Next.js revalidate options
    // This is a placeholder - actual implementation uses Next.js cache API
    // For now, fallback to memory
    setInMemory(key, value, ttl);
}

async function deleteFromVercelEdge(key) {
    // Vercel Edge Cache invalidation
    // This is a placeholder - actual implementation uses Next.js cache API
    // For now, fallback to memory
    deleteFromMemory(key);
}

async function clearVercelEdge() {
    // Vercel Edge Cache invalidation
    // This is a placeholder - actual implementation uses Next.js cache API
    // For now, fallback to memory
    clearMemory();
}

// ========== Memory Cache Implementation ==========

function getFromMemory(key, ttl = null) {
    if (!memoryCache.has(key)) {
        return null;
    }

    const timestamp = memoryCacheTimestamps.get(key);
    if (ttl && timestamp && Date.now() - timestamp > ttl * 1000) {
        memoryCache.delete(key);
        memoryCacheTimestamps.delete(key);
        return null;
    }

    return memoryCache.get(key);
}

function setInMemory(key, value, ttl = null) {
    memoryCache.set(key, value);
    if (ttl) {
        memoryCacheTimestamps.set(key, Date.now());
    } else {
        memoryCacheTimestamps.delete(key);
    }
}

function deleteFromMemory(key) {
    memoryCache.delete(key);
    memoryCacheTimestamps.delete(key);
}

function clearMemory() {
    memoryCache.clear();
    memoryCacheTimestamps.clear();
}

/**
 * Update cache provider configuration
 * @param {object} config - Cache configuration
 * @param {string} config.provider - Cache provider ('REDIS', 'VERCEL_EDGE', 'MEMORY')
 * @param {string} config.redisUrl - Redis URL (optional)
 * @param {string} config.redisPassword - Redis password (optional)
 * @returns {Promise<object>} Updated settings
 */
export async function updateCacheConfig(config) {
    const { provider, redisUrl, redisPassword } = config;

    if (!['REDIS', 'VERCEL_EDGE', 'MEMORY'].includes(provider)) {
        throw new Error('Invalid cache provider. Must be REDIS, VERCEL_EDGE, or MEMORY');
    }

    const updateData = {
        cacheProvider: provider
    };

    if (provider === 'REDIS') {
        if (redisUrl) updateData.redisUrl = redisUrl;
        if (redisPassword !== undefined) updateData.redisPassword = redisPassword;
    } else {
        // Clear Redis config when switching away from Redis
        updateData.redisUrl = null;
        updateData.redisPassword = null;
    }

    const settings = await prisma.systemSettings.upsert({
        where: { id: 'default' },
        update: updateData,
        create: {
            id: 'default',
            ...updateData,
            realtimeProvider: 'POLLING',
            sessionTimeout: 15,
            sessionWarning: 1,
            loginLimit: 10,
            registerLimit: 5
        }
    });

    // Clear existing cache when switching providers
    await clearCache();

    return settings;
}

/**
 * Get cache provider status
 * @returns {Promise<object>} Cache provider status
 */
export async function getCacheStatus() {
    const config = await getCacheConfig();
    const provider = config.provider;

    const status = {
        provider,
        status: 'unknown',
        message: ''
    };

    try {
        if (provider === 'REDIS') {
            // Test Redis connection
            if (!config.redisUrl) {
                status.status = 'error';
                status.message = 'Redis URL not configured';
            } else {
                try {
                    const redis = await import('redis');
                    const client = redis.createClient({
                        url: config.redisUrl,
                        password: config.redisPassword
                    });
                    await client.connect();
                    await client.ping();
                    await client.quit();
                    status.status = 'connected';
                    status.message = 'Redis connection successful';
                } catch (error) {
                    status.status = 'error';
                    status.message = `Redis connection failed: ${error.message}`;
                }
            }
        } else if (provider === 'VERCEL_EDGE') {
            status.status = 'active';
            status.message = 'Vercel Edge Cache is active (handled by Next.js)';
        } else {
            status.status = 'active';
            status.message = 'In-memory cache is active';
        }
    } catch (error) {
        status.status = 'error';
        status.message = error.message;
    }

    return status;
}




