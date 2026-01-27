const { prisma } = require('../../budolpay-0.1.0/packages/database/index.js');

async function checkRecentUsers() {
  console.log('Checking database:', process.env.DATABASE_URL);
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  if (users.length === 0) {
    console.log('No users found');
    return;
  }

  console.log('Recent Users:');
  for (const user of users) {
    const logCount = await prisma.auditLog.count({ where: { userId: user.id } });
    console.log(`- ${user.id}: ${user.firstName} ${user.lastName} (${user.phoneNumber}) - Logs: ${logCount}`);
    
    if (logCount > 0) {
        const logs = await prisma.auditLog.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 3
        });
        logs.forEach(l => console.log(`  [${l.createdAt.toISOString()}] ${l.action}`));
    }
  }
}

checkRecentUsers()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
