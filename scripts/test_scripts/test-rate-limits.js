const { prisma } = require('../../budolpay-0.1.0/packages/database/index.js');

/**
 * Database-backed rate limiter for Next.js API routes.
 * Follows Budol Ecosystem Security Standard Phase 3.
 * 
 * Ported to CommonJS for testing script compatibility.
 */
async function checkRateLimit(
  key,
  limit,
  windowSeconds
) {
  const now = new Date();
  
  const record = await prisma.rateLimit.findUnique({
    where: { key }
  });

  if (!record || record.expiresAt < now) {
    const expiresAt = new Date(now.getTime() + windowSeconds * 1000);
    
    await prisma.rateLimit.upsert({
      where: { key },
      create: {
        key,
        hits: 1,
        expiresAt
      },
      update: {
        hits: 1,
        expiresAt
      }
    });

    return {
      success: true,
      remaining: limit - 1,
      reset: expiresAt
    };
  }

  if (record.hits >= limit) {
    return {
      success: false,
      remaining: 0,
      reset: record.expiresAt
    };
  }

  const updated = await prisma.rateLimit.update({
    where: { key },
    data: {
      hits: { increment: 1 }
    }
  });

  return {
    success: true,
    remaining: limit - updated.hits,
    reset: record.expiresAt
  };
}

/**
 * Test script for Rate Limiting logic.
 * Run with: node scripts/test_scripts/test-rate-limits.js
 */
async function runTest() {
  console.log('🚀 INITIALIZING RATE LIMIT TEST...');
  const TEST_KEY = `test_limit_${Date.now()}`;
  const LIMIT = 3;
  const WINDOW = 60; // 1 minute

  console.log(`--- Testing key: ${TEST_KEY} with limit ${LIMIT} ---`);

  try {
    // 1. First attempt
    let res = await checkRateLimit(TEST_KEY, LIMIT, WINDOW);
    console.log(`Attempt 1: ${res.success ? '✅ PASSED' : '❌ FAILED'} (Remaining: ${res.remaining})`);

    // 2. Second attempt
    res = await checkRateLimit(TEST_KEY, LIMIT, WINDOW);
    console.log(`Attempt 2: ${res.success ? '✅ PASSED' : '❌ FAILED'} (Remaining: ${res.remaining})`);

    // 3. Third attempt
    res = await checkRateLimit(TEST_KEY, LIMIT, WINDOW);
    console.log(`Attempt 3: ${res.success ? '✅ PASSED' : '❌ FAILED'} (Remaining: ${res.remaining})`);

    // 4. Fourth attempt (Should fail)
    res = await checkRateLimit(TEST_KEY, LIMIT, WINDOW);
    console.log(`Attempt 4: ${res.success ? '❌ PASSED (Unexpected)' : '✅ BLOCKED'} (Remaining: ${res.remaining})`);

    // 5. Cleanup
    await prisma.rateLimit.delete({ where: { key: TEST_KEY } });
    console.log('🧹 Test key cleaned up.');

    console.log('🏁 RATE LIMIT TEST COMPLETE');
    process.exit(0);
  } catch (err) {
    console.error('💥 Test failed:', err);
    process.exit(1);
  }
}

runTest();
