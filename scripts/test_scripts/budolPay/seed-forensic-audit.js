const { prisma } = require('d:/IT Projects/budolEcosystem/budolpay-0.1.0/packages/database/index.js');

async function main() {
  console.log('--- Seeding Forensic Audit Trail (Compliance Verification) ---');

  try {
    // 1. Get an Admin User to attribute the logs to
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!admin) {
      console.error('No ADMIN user found. Please run promotion script first.');
      process.exit(1);
    }

    console.log(`Using Admin Actor: ${admin.email} (${admin.id})`);

    const logs = [
      {
        action: 'SECURITY_LOGIN_SUCCESS',
        entity: 'Security',
        entityId: admin.id,
        userId: admin.id,
        ipAddress: '192.168.1.105',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        device: 'Admin-Workstation-01',
        metadata: {
          location: 'Manila, PH',
          compliance: { pci_dss: '10.2.1', bsp: 'Circular 808' }
        }
      },
      {
        action: 'ROLE_UPDATED_TO_ADMIN',
        entity: 'User',
        entityId: '508295cb-b386-421c-8169-542b97a24a1b',
        userId: admin.id,
        ipAddress: 'Internal System',
        newValue: { role: 'ADMIN' },
        oldValue: { role: 'STAFF' },
        metadata: {
          reason: 'Promoted for Ecosystem Orchestration',
          compliance: { pci_dss: '10.2.2', bsp: 'Circular 808' }
        }
      },
      {
        action: 'FULL_SECURITY_AUDIT_COMPLETE',
        entity: 'SecurityGateway',
        entityId: `AUDIT-${Date.now()}`,
        userId: admin.id,
        ipAddress: '127.0.0.1',
        newValue: {
          integrityCheck: "PASS",
          encryptionStatus: "VERIFIED (AES-256-CBC)",
          tlsStatus: "ENFORCED (TLS 1.3)",
          pciDssCompliance: "VALIDATED (v4.0)"
        },
        metadata: {
          purpose: 'Routine Compliance Scan',
          compliance: { pci_dss: '10.6', bsp: 'Circular 808' }
        }
      },
      {
        action: 'BSP_REPORT_GENERATED',
        entity: 'Regulatory',
        entityId: 'BSP-2026-Q1-TRX-001',
        userId: admin.id,
        ipAddress: 'Internal System',
        metadata: {
          reportType: 'Quarterly Transaction Summary',
          compliance: { bsp: 'Circular 940' }
        }
      }
    ];

    console.log(`Creating ${logs.length} audit entries...`);

    for (const log of logs) {
      await prisma.auditLog.create({ data: log });
      console.log(`[✔] Logged: ${log.action}`);
    }

    const count = await prisma.auditLog.count();
    console.log(`--- Seeding Complete. Total Audit Logs: ${count} ---`);

  } catch (error) {
    console.error('Error seeding audit logs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
