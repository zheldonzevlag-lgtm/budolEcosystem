const { prisma } = require('./packages/database/index.js');

async function testAuditLogWithValidUser() {
  try {
    // Get a valid user ID first
    const user = await prisma.user.findFirst({
      select: { id: true, email: true, firstName: true, lastName: true }
    });
    
    if (!user) {
      console.log('❌ No users found in database');
      return;
    }
    
    console.log('Found user:', user.email, 'ID:', user.id);
    
    // Import the shared audit helper
    const { createAuditLog } = require('./packages/audit/src/index.ts');
    
    console.log('Testing audit log creation with real-time broadcasting...');
    
    const auditLog = await createAuditLog({
      action: 'TEST_AUDIT_LOG_REALTIME_PUSHER',
      entity: 'Security',
      entityId: 'test-pusher-123',
      userId: user.id,
      metadata: {
        test: true,
        timestamp: new Date().toISOString(),
        userName: `${user.firstName} ${user.lastName}`,
        provider: 'PUSHER'
      }
    });
    
    if (auditLog) {
      console.log('✅ Audit log created successfully:', auditLog.id);
      console.log('📡 Real-time event should have been broadcasted via Pusher');
      console.log('📋 Audit log details:', {
        action: auditLog.action,
        entity: auditLog.entity,
        createdAt: auditLog.createdAt,
        user: auditLog.userId
      });
    } else {
      console.log('❌ Failed to create audit log');
    }
  } catch (error) {
    console.error('❌ Error creating audit log:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testAuditLogWithValidUser();