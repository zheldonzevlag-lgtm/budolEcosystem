const { createAuditLog } = require('./budolpay-0.1.0/packages/audit/dist/index.js');
const { prisma } = require('./budolpay-0.1.0/packages/database/index.js');

async function testRealtimeAuditUpdates() {
  try {
    console.log('🧪 Testing Real-time Audit Updates...');
    
    // Find a valid user
    const user = await prisma.user.findFirst({ select: { id: true, email: true } });
    if (!user) {
      console.error('❌ No valid user found');
      return;
    }
    
    console.log(`✅ Using user: ${user.email} (${user.id})`);
    
    // Create test audit logs with different entities to test filtering
    const testCases = [
      {
        action: 'SECURITY_LOGIN_ATTEMPT',
        entity: 'Security',
        metadata: { test: true, ipAddress: '127.0.0.1', compliance: { pci_dss: '10.2.2' } }
      },
      {
        action: 'FINANCIAL_TRANSFER_INITIATED',
        entity: 'Financial',
        metadata: { test: true, amount: 1000, compliance: { bsp: 'Circular 808' } }
      },
      {
        action: 'SYSTEM_CONFIG_CHANGED',
        entity: 'System',
        metadata: { test: true, setting: 'realtimeProvider', compliance: { pci_dss: '10.2.2' } }
      }
    ];
    
    console.log('\n📡 Creating test audit logs...');
    
    for (const testCase of testCases) {
      console.log(`Creating: ${testCase.action}...`);
      const auditLog = await createAuditLog({
        action: testCase.action,
        entity: testCase.entity,
        entityId: `test-${Date.now()}`,
        userId: user.id,
        metadata: testCase.metadata,
        ipAddress: '127.0.0.1'
      });
      
      console.log(`✅ Created: ${auditLog.id} - ${testCase.action}`);
      
      // Wait a bit between logs to see realtime updates
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n🎯 Test completed! Check the admin dashboard for realtime updates.');
    console.log('💡 The admin dashboard should receive these logs in real-time without refresh.');
    console.log('🔍 Look for logs with action: SECURITY_LOGIN_ATTEMPT, FINANCIAL_TRANSFER_INITIATED, SYSTEM_CONFIG_CHANGED');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testRealtimeAuditUpdates();