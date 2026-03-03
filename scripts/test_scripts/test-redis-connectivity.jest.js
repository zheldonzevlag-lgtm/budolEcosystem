/**
 * Redis Connectivity Test - Phase 2.3 Verification
 * File: scripts/test_scripts/test-redis-connectivity.jest.js
 *
 * WHY: Per the Budol Implementation Standard, all infrastructure changes must
 *      have accompanying tests. This test verifies that the Redis client lib
 *      correctly connects to the budol-redis EC2 and performs basic operations.
 *
 * WHAT: Tests the following:
 *   1. Redis client can connect to REDIS_URL
 *   2. cacheSet / cacheGet round-trip works correctly
 *   3. TTL expiry is enforced (cache invalidation)
 *   4. cacheDel removes keys
 *   5. redisRateLimit increments correctly and blocks on limit
 *   6. isRedisConnected() returns true when connected
 *
 * HOW TO RUN (from budolshap-0.1.0 directory):
 *   npx jest scripts/test_scripts/test-redis-connectivity.jest.js --testTimeout=15000
 *
 * NOTE: Requires REDIS_URL to be set, or defaults to localhost:6379.
 *       For AWS VPC testing, run from an EC2 within the 10.0.0.0/16 subnet,
 *       or set REDIS_URL=redis://10.0.11.31:6379 in .env.test
 *
 * COMPLIANCE: No sensitive/production data is used in these tests.
 *             All test keys are prefixed "test:" and cleaned up after each test.
 */

import { jest } from '@jest/globals';

// ---------------------------------------------------------------------------
// Mock setup: allow running without real Redis by mocking the redis module
// ---------------------------------------------------------------------------
// The actual import path might need adjustment based on project structure
// We use dynamic import to allow environment-conditional testing

let cacheSet, cacheGet, cacheDel, redisRateLimit, isRedisConnected, disconnectRedis;

// Test timeout - Redis ops should be fast even over VPC
const REDIS_TIMEOUT = 10000; // 10s

describe('Redis Client - Phase 2.3 Connectivity Tests', () => {

    // -----------------------------------------------------------------------
    // Setup: import redis module and verify connection before tests begin
    // -----------------------------------------------------------------------
    beforeAll(async () => {
        // Dynamic import to support ESM and allow conditional loading
        try {
            const redisModule = await import('../../lib/redis.js');
            cacheSet = redisModule.cacheSet;
            cacheGet = redisModule.cacheGet;
            cacheDel = redisModule.cacheDel;
            redisRateLimit = redisModule.redisRateLimit;
            isRedisConnected = redisModule.isRedisConnected;
            disconnectRedis = redisModule.disconnectRedis;

            // Wait up to 5 seconds for Redis to connect
            const start = Date.now();
            while (!isRedisConnected() && Date.now() - start < 5000) {
                await new Promise(r => setTimeout(r, 200));
            }
        } catch (err) {
            console.error('[Test Setup] Failed to import redis module:', err.message);
            throw err;
        }
    }, 10000);

    // -----------------------------------------------------------------------
    // Cleanup: remove all test keys and disconnect after tests
    // -----------------------------------------------------------------------
    afterAll(async () => {
        // Clean up test keys
        if (cacheDel) {
            await cacheDel('test:connectivity');
            await cacheDel('test:ttl-key');
            await cacheDel('test:del-key');
            await cacheDel('rl:test:rate-limit-user1');
        }
        if (disconnectRedis) {
            await disconnectRedis();
        }
    }, 10000);

    // -----------------------------------------------------------------------
    // Test 1: Connection Health
    // -----------------------------------------------------------------------
    test('1. Redis client should be connected after startup', () => {
        expect(isRedisConnected()).toBe(true);
    }, REDIS_TIMEOUT);

    // -----------------------------------------------------------------------
    // Test 2: Basic Cache Set and Get
    // -----------------------------------------------------------------------
    test('2. cacheSet should store a value and cacheGet should retrieve it', async () => {
        const key = 'test:connectivity';
        const value = {
            service: 'budolshap',
            phase: '2.3 - Redis',
            timestamp: new Date().toISOString(),
        };

        // Set in cache with 60 second TTL
        const setResult = await cacheSet(key, value, 60);
        expect(setResult).toBe(true);

        // Retrieve from cache
        const retrieved = await cacheGet(key);
        expect(retrieved).not.toBeNull();
        expect(retrieved.service).toBe('budolshap');
        expect(retrieved.phase).toBe('2.3 - Redis');
    }, REDIS_TIMEOUT);

    // -----------------------------------------------------------------------
    // Test 3: Cache Miss for Non-Existent Key
    // -----------------------------------------------------------------------
    test('3. cacheGet should return null for non-existent keys', async () => {
        const result = await cacheGet('test:nonexistent-key-xyz-12345');
        expect(result).toBeNull();
    }, REDIS_TIMEOUT);

    // -----------------------------------------------------------------------
    // Test 4: Cache Delete
    // -----------------------------------------------------------------------
    test('4. cacheDel should remove a key from cache', async () => {
        const key = 'test:del-key';
        await cacheSet(key, { data: 'to be deleted' }, 60);

        // Verify it exists
        expect(await cacheGet(key)).not.toBeNull();

        // Delete it
        const delResult = await cacheDel(key);
        expect(delResult).toBe(true);

        // Verify it's gone
        expect(await cacheGet(key)).toBeNull();
    }, REDIS_TIMEOUT);

    // -----------------------------------------------------------------------
    // Test 5: TTL Enforcement (short TTL = 1 second)
    // -----------------------------------------------------------------------
    test('5. Cache entries should expire after TTL elapses', async () => {
        const key = 'test:ttl-key';
        await cacheSet(key, { secret: 'expires-soon' }, 1); // 1 second TTL

        // Should exist immediately
        expect(await cacheGet(key)).not.toBeNull();

        // Wait 1.5 seconds for TTL to expire
        await new Promise(r => setTimeout(r, 1500));

        // Should now be null (expired)
        expect(await cacheGet(key)).toBeNull();
    }, REDIS_TIMEOUT + 2000); // Extended timeout for this test

    // -----------------------------------------------------------------------
    // Test 6: Redis Rate Limiting - Basic Counter
    // -----------------------------------------------------------------------
    test('6. redisRateLimit should increment correctly', async () => {
        const key = 'test:rate-limit-user1';

        // First request: count=1, limit=5 → success
        const r1 = await redisRateLimit(key, 5, 60);
        expect(r1).not.toBeNull();
        expect(r1.success).toBe(true);
        expect(r1.remaining).toBe(4);

        // Second request: count=2
        const r2 = await redisRateLimit(key, 5, 60);
        expect(r2.success).toBe(true);
        expect(r2.remaining).toBe(3);
    }, REDIS_TIMEOUT);

    // -----------------------------------------------------------------------
    // Test 7: Redis Rate Limiting - Block at Limit
    // -----------------------------------------------------------------------
    test('7. redisRateLimit should block when limit is exceeded', async () => {
        // Use a fresh key for this test
        const key = 'test:rate-limit-block-user2';

        // Exhaust the limit (limit=3)
        await redisRateLimit(key, 3, 60);
        await redisRateLimit(key, 3, 60);
        await redisRateLimit(key, 3, 60);

        // 4th request should be blocked
        const r4 = await redisRateLimit(key, 3, 60);
        expect(r4.success).toBe(false);
        expect(r4.remaining).toBe(0);

        // Cleanup
        await cacheDel(`rl:${key}`);
    }, REDIS_TIMEOUT);

    // -----------------------------------------------------------------------
    // Test 8: JSON Serialization of Complex Objects
    // -----------------------------------------------------------------------
    test('8. Cache should correctly serialize and deserialize complex objects', async () => {
        const key = 'test:complex-object';
        const complexVal = {
            nested: { deeper: { value: 42 } },
            array: [1, 'two', { three: true }],
            unicode: '₱ Budol Pay',
            bool: false,
            nullVal: null,
        };

        await cacheSet(key, complexVal, 30);
        const retrieved = await cacheGet(key);

        expect(retrieved.nested.deeper.value).toBe(42);
        expect(retrieved.array[2].three).toBe(true);
        expect(retrieved.unicode).toBe('₱ Budol Pay');
        expect(retrieved.bool).toBe(false);
        expect(retrieved.nullVal).toBeNull();

        // Cleanup
        await cacheDel(key);
    }, REDIS_TIMEOUT);
});
