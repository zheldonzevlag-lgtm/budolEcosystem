const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

// Mock request-like object data
const MOCK_USER_ID = 'user_test_123';
const MOCK_IP = '127.0.0.1';
const MOCK_COUNTRY = 'TestLand';
const MOCK_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function testAuditLogCreation() {
    console.log("🧪 Starting Audit Log Test...");

    try {
        // 1. Ensure a test user exists or get the first available user
        let user = await prisma.user.findFirst();
        if (!user) {
            console.log("⚠️ No users found. Creating a temporary test user...");
            user = await prisma.user.create({
                data: {
                    id: MOCK_USER_ID,
                    name: "Test User",
                    email: "test_audit@example.com",
                    password: "hashed_password_placeholder",
                    emailVerified: true
                }
            });
        }
        console.log(`👤 Using User: ${user.email} (${user.id})`);

        // 2. Simulate the Logic inside /api/auth/login or /api/auth/logout
        // We can't call the Next.js API route directly from a node script easily without running the server,
        // so we will verify the DATABASE WRITE capability using the same logic pattern.

        // This confirms the Prisma Schema acts as expected.
        console.log("📝 Attempting to write LOGIN log...");
        const loginLog = await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'LOGIN',
                ipAddress: MOCK_IP,
                country: MOCK_COUNTRY,
                device: 'Test Device / Chrome', // Simplified for this direct test
                userAgent: MOCK_USER_AGENT
            }
        });
        console.log(`✅ Login Log Created! ID: ${loginLog.id}`);

        console.log("📝 Attempting to write LOGOUT log...");
        const logoutLog = await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'LOGOUT',
                ipAddress: MOCK_IP,
                country: MOCK_COUNTRY,
                device: 'Test Device / Chrome',
                userAgent: MOCK_USER_AGENT
            }
        });
        console.log(`✅ Logout Log Created! ID: ${logoutLog.id}`);

        // 3. Verify they exist
        const count = await prisma.auditLog.count({
            where: { userId: user.id }
        });
        console.log(`📊 Total Logs for User: ${count}`);

        if (count >= 2) {
            console.log("🎉 SUCCESS: Audit Audit Schema and Database Write are fully functional.");
        } else {
            console.error("❌ FAILURE: Logs were not persisted.");
        }

    } catch (error) {
        console.error("❌ Test Failed:", error);
    } finally {
        // Cleanup (Optional, but good for keeping DB clean)
        // await prisma.auditLog.deleteMany({ where: { userId: MOCK_USER_ID } });
        // if (MOCK_USER_ID === 'user_test_123') await prisma.user.delete({ where: { id: MOCK_USER_ID } });

        await prisma.$disconnect();
    }
}

testAuditLogCreation();
