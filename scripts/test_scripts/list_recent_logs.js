const { prisma } = require('../../budolpay-0.1.0/packages/database/index.js');

async function listRecentLogs() {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            phoneNumber: true
          }
        }
      }
    });
    console.log('--- RECENT AUDIT LOGS ---');
    logs.forEach(log => {
      const userName = log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System';
      const phone = log.user ? log.user.phoneNumber : 'N/A';
      console.log(`[${log.createdAt.toISOString()}] ${log.action} | User: ${userName} (${phone}) | Entity: ${log.entity}`);
    });
    console.log('-------------------------');
  } catch (error) {
    console.error('Error listing logs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listRecentLogs();
