import 'dotenv/config'; // Load env vars
import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient(); // Removed duplicate

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error("❌ DATABASE_URL is undefined");
    process.exit(1);
}
console.log(`ℹ️ DATABASE_URL loaded: ${dbUrl.substring(0, 15)}... (Length: ${dbUrl.length})`);

const directUrl = process.env.DIRECT_URL;
if (directUrl) {
    console.log(`ℹ️ DIRECT_URL loaded: ${directUrl.substring(0, 15)}... (Length: ${directUrl.length})`);
} else {
    console.log(`⚠️ DIRECT_URL is undefined, polyfilling with DATABASE_URL`);
    process.env.DIRECT_URL = process.env.DATABASE_URL;
}

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});


/**
 * Replicating the logic from lib/rate-limit.js for independent testing
 */
async function testRateLimitLogic(key, limit, windowSeconds) {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const expireAt = BigInt(now + windowMs);

    console.log(`\n🧪 Testing Key: "${key}" | Limit: ${limit} | Window: ${windowSeconds}s`);

    try {
        const result = await prisma.$transaction(async (tx) => {
            let record = await tx.rateLimit.findUnique({
                where: { key }
            });

            if (!record || Number(record.expireAt) < now) {
                console.log('   -> New/Expired record. Resetting.');
                record = await tx.rateLimit.upsert({
                    where: { key },
                    update: { points: 1, expireAt },
                    create: { key, points: 1, expireAt }
                });
            } else {
                console.log(`   -> Existing record. Points: ${record.points}. Incrementing.`);
                record = await tx.rateLimit.update({
                    where: { key },
                    data: { points: { increment: 1 } }
                });
            }
            return record;
        });

        const currentPoints = result.points;
        const success = currentPoints <= limit;
        const remaining = Math.max(0, limit - currentPoints);

        console.log(`   ✅ Result: Success=${success}, Points=${currentPoints}, Remaining=${remaining}`);
        return success;

    } catch (error) {
        console.error("   ❌ Rate Limit Error:", error);
        return false;
    }
}

async function runTest() {
    console.log('🚀 INITIALIZING RATE LIMIT TEST...');
    const TEST_KEY = `test_login_${Date.now()}`;
    const LIMIT = 3;

    // 1. Clean start
    await prisma.rateLimit.deleteMany({ where: { key: TEST_KEY } });

    // 2. Run attempts
    console.log(`--- Attempting ${LIMIT + 2} hits (Limit is ${LIMIT}) ---`);

    for (let i = 1; i <= LIMIT + 2; i++) {
        const allowed = await testRateLimitLogic(TEST_KEY, LIMIT, 60);
        if (i <= LIMIT) {
            if (!allowed) console.error(`   ❌ Failed on attempt ${i} (Should have passed)`);
        } else {
            if (allowed) console.error(`   ❌ Passed on attempt ${i} (Should have failed)`);
            else console.log(`   ✨ Blocked correctly on attempt ${i}`);
        }
    }

    // 3. Verify System Settings columns exist
    console.log('\n🔍 Verifying SystemSettings Schema...');
    try {
        const settings = await prisma.systemSettings.findFirst();
        if (settings && 'loginLimit' in settings && 'registerLimit' in settings) {
            console.log('   ✅ SystemSettings table has `loginLimit` and `registerLimit` columns.');
            console.log('   Current settings:', settings);
        } else {
            console.error('   ❌ SystemSettings columns missing or table empty.');
        }
    } catch (e) {
        console.error('   ❌ Failed to query SystemSettings:', e);
    }

    console.log('\n🏁 TEST COMPLETE');
    await prisma.$disconnect();
}

runTest();
