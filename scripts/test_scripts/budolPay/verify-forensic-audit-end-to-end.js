const { prisma } = require('d:/IT Projects/budolEcosystem/budolpay-0.1.0/packages/database/index.js');

async function verifyAuditTrail() {
  console.log('--- Forensic Audit Trail Verification ---');

  try {
    const logs = await prisma.auditLog.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    if (logs.length === 0) {
      console.error('No audit logs found. Verification FAILED.');
      process.exit(1);
    }

    console.log(`Found ${logs.length} audit logs.`);

    const securityLogs = logs.filter(l => l.action.startsWith('SECURITY_') || l.entity === 'Security');
    console.log(`- Security Logs: ${securityLogs.length}`);

    const complianceLogs = logs.filter(l => l.metadata && l.metadata.compliance);
    console.log(`- Logs with Compliance Metadata: ${complianceLogs.length}`);

    logs.forEach(log => {
      console.log(`[${log.createdAt.toISOString()}] ${log.action} - ${log.user?.email || 'System'}`);
      if (log.metadata && log.metadata.compliance) {
        console.log(`   Compliance: ${JSON.stringify(log.metadata.compliance)}`);
      }
    });

    console.log('--- Verification SUCCESS ---');

  } catch (error) {
    console.error('Verification Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAuditTrail();
