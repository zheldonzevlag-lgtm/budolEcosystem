
import { prisma } from '../../lib/prisma.js';

async function testAuditLogs() {
  try {
    console.log('Testing Audit Logs Query...');
    
    // Test findMany with status
    const logs = await prisma.auditLog.findMany({
      where: {
        status: { in: ['FAILURE', 'WARNING'] }
      },
      take: 5
    });
    
    console.log(`Found ${logs.length} logs with status FAILURE/WARNING`);
    
    if (logs.length > 0) {
      console.log('Sample log status:', logs[0].status);
    }
    
    // Test count with status
    const count = await prisma.auditLog.count({
      where: {
        status: { in: ['FAILURE', 'WARNING'] }
      }
    });
    console.log(`Total count: ${count}`);
    
    console.log('Audit Logs Query successful!');
  } catch (error) {
    console.error('Audit Logs Query failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuditLogs();
