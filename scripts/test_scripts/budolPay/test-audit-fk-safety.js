
const { prisma } = require('d:/IT Projects/budolEcosystem/budolpay-0.1.0/packages/database/index.js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../budolpay-0.1.0/.env') });

async function testFKSafety() {
    console.log('--- Testing Audit Log Foreign Key Safety (PCI DSS 10.2.2) ---');
    
    // Simulate a user that exists in SSO but NOT in local DB
    const nonExistentUserId = '00000000-0000-0000-0000-000000000000';
    const ssoUserEmail = 'sso-only-user@example.com';
    
    console.log(`Simulating Audit Log for non-existent local user: ${ssoUserEmail}`);
    
    try {
        // This simulates the logic I added to the settings pages
        const action = "CHANGE_ENV_VAR";
        const entityId = "TEST_CONFIG";
        
        // Logic: if user not found locally, userId is null but email is in metadata
        const auditLogData = {
            action: action,
            entity: "SystemSetting",
            entityId: entityId,
            userId: null, // This prevents the FK violation
            newValue: { value: "test" },
            metadata: {
                actor: ssoUserEmail,
                ssoId: nonExistentUserId,
                compliance: {
                    pci_dss: "10.2.2",
                    bsp: "Circular 808"
                }
            }
        };
        
        const log = await prisma.auditLog.create({
            data: auditLogData
        });
        
        console.log('✅ SUCCESS: Audit log created without FK violation.');
        console.log(`   Action: ${log.action}`);
        console.log(`   Actor (from metadata): ${log.metadata.actor}`);
        console.log(`   UserId (should be null): ${log.userId}`);
        
        // Clean up
        await prisma.auditLog.delete({ where: { id: log.id } });
        console.log('✅ Cleanup successful.');
        
    } catch (error) {
        console.error('❌ FAILURE: FK Violation occurred!');
        console.error(error);
        process.exit(1);
    }
}

testFKSafety();
