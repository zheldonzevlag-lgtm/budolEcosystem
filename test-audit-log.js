const { createAuditLog } = require('./budolpay-0.1.0/packages/audit/src/index.ts');

async function testAuditLog() {
  try {
    console.log('Testing audit log creation...');
    
    const auditLog = await createAuditLog({
      action: 'TEST_AUDIT_LOG',
      entity: 'Security',
      entityId: 'test-123',
      userId: 'system-test',
      metadata: {
        test: true,
        timestamp: new Date().toISOString()
      }
    });
    
    if (auditLog) {
      console.log('✅ Audit log created successfully:', auditLog.id);
      console.log('📡 Real-time event should have been triggered');
    } else {
      console.log('❌ Failed to create audit log');
    }
  } catch (error) {
    console.error('❌ Error creating audit log:', error.message);
  }
}

testAuditLog();