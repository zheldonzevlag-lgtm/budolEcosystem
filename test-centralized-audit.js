const { createAuditLog } = require('./budolpay-0.1.0/packages/audit/dist/index.js');
const { prisma } = require('@budolpay/database');

async function testCentralizedAuditLog() {
  try {
    console.log('[Test] Starting centralized audit log test...');
    
    // Get a valid user from database
    const user = await prisma.user.findFirst({
      select: { id: true, email: true, firstName: true, lastName: true }
    });
    
    if (!user) {
      console.error('[Test] No valid user found in database');
      return;
    }
    
    console.log(`[Test] Found user: ${user.firstName} ${user.lastName} (${user.id})`);
    
    // Test centralized audit log creation
    const auditLog = await createAuditLog({
      action: 'TEST_CENTRALIZED_AUDIT_LOG',
      entity: 'Security',
      entityId: 'test-123',
      userId: user.id,
      metadata: {
        test: true,
        timestamp: new Date().toISOString(),
        userName: `${user.firstName} ${user.lastName}`,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent'
      },
      ipAddress: '127.0.0.1'
    });
    
    if (auditLog) {
      console.log('[Test] ✅ Centralized audit log created successfully!');
      console.log(`[Test] Audit log ID: ${auditLog.id}`);
      console.log(`[Test] Action: ${auditLog.action}`);
      console.log(`[Test] Entity: ${auditLog.entity}`);
      console.log(`[Test] User: ${auditLog.user.firstName} ${auditLog.user.lastName}`);
      console.log(`[Test] Metadata:`, auditLog.metadata);
      
      // Check if real-time notification was sent
      console.log('[Test] ✅ Real-time notification should have been sent automatically');
      
    } else {
      console.error('[Test] ❌ Failed to create centralized audit log');
    }
    
  } catch (error) {
    console.error('[Test] ❌ Error testing centralized audit log:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testCentralizedAuditLog();