
const { prisma } = require('d:/IT Projects/budolEcosystem/budolpay-0.1.0/packages/database/index.js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../budolpay-0.1.0/.env') });

async function testAuditIdentity() {
    console.log('--- Testing Audit Identity Attribution (PCI DSS 10.2.2) ---');

    try {
        // 1. Find an Admin user
        const admin = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (!admin) {
            console.error('❌ FAILED: No ADMIN user found. Please run create-admin-account.js first.');
            return;
        }

        console.log(`✅ Found Admin Actor: ${admin.email} (ID: ${admin.id})`);

        // 2. Simulate a setting change log entry (as implemented in the server actions)
        const action = "CHANGE_ENV_VAR";
        const entityId = "TEST_SETTING_" + Date.now();
        
        console.log(`Creating test audit log for action: ${action}...`);
        
        const log = await prisma.auditLog.create({
            data: {
                action: action,
                entity: "SystemSetting",
                entityId: entityId,
                userId: admin.id,
                newValue: { value: "test-value", appId: "test-app", isActive: true },
                metadata: {
                    compliance: {
                        pci_dss: "10.2.2",
                        bsp: "Circular 808"
                    }
                }
            },
            include: {
                user: true
            }
        });

        if (log.userId === admin.id && log.user) {
            console.log(`✅ SUCCESS: Audit log created with correct userId and user relation.`);
            console.log(`   Action: ${log.action}`);
            console.log(`   Staff Identity: ${log.user.firstName} ${log.user.lastName} (${log.user.email})`);
        } else {
            console.error('❌ FAILED: Audit log missing userId or user relation.');
            process.exit(1);
        }

        // 3. Verify System filter in API (simulating the query in security/route.ts)
        console.log('Verifying System filter visibility...');
        const systemLogs = await prisma.auditLog.findMany({
            where: {
                OR: [
                    { entity: "System" },
                    { entity: "Regulatory" },
                    { entity: "SystemSetting" },
                    { action: { contains: "AUDIT" } },
                    { action: { contains: "REPORT" } },
                    { action: { contains: "ENV_VAR" } },
                    { action: { contains: "VERCEL" } }
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { user: true }
        });

        const foundLog = systemLogs.find(l => l.id === log.id);
        if (foundLog && foundLog.user) {
            console.log('✅ SUCCESS: New audit log is visible in the System filter with user identity.');
        } else {
            console.error('❌ FAILED: New audit log not found in System filter or missing user identity.');
            process.exit(1);
        }

        console.log('\n✨ ALL IDENTITY ATTRIBUTION TESTS PASSED');
        
    } catch (error) {
        console.error('❌ TEST ERROR:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testAuditIdentity();
