const { prisma } = require('../../budolpay-0.1.0/packages/database/index.js');

async function searchSecurityLogs() {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        action: {
          startsWith: 'SECURITY_'
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: true
      }
    });
    console.log(`--- SECURITY LOGS (Count: ${logs.length}) ---`);
    logs.forEach(log => {
      const user = log.user ? `${log.user.firstName} ${log.user.lastName} (${log.user.phoneNumber})` : 'Unknown';
      console.log(`[${log.createdAt.toISOString()}] ${log.action} | User: ${user} | Metadata: ${JSON.stringify(log.metadata)}`);
    });
    console.log('------------------------------------------');
  } catch (error) {
    console.error('Error searching security logs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

searchSecurityLogs();
