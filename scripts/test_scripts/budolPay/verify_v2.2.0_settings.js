const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../budolpay-0.1.0/.env') });
const { PrismaClient } = require('d:/IT Projects/budolEcosystem/budolpay-0.1.0/node_modules/@prisma/client');

async function verifySettings() {
  console.log('--- BudolPay v2.2.0 Settings Verification ---');
  const prisma = new PrismaClient();

  try {
    const settings = await prisma.systemSetting.findMany();
    
    const groups = [...new Set(settings.map(s => s.group))];
    console.log('Detected Groups:', groups.join(', '));

    const expectedGroups = ['SYSTEM', 'PAYMENT', 'REALTIME', 'NOTIFICATION', 'SECURITY'];
    const missingGroups = expectedGroups.filter(g => !groups.includes(g));

    if (missingGroups.length > 0) {
      console.error('FAILED: Missing expected groups:', missingGroups.join(', '));
    } else {
      console.log('SUCCESS: All expected groups present.');
    }

    const keyChecks = [
      { key: 'REALTIME_METHOD', group: 'REALTIME' },
      { key: 'RESEND_API_KEY', group: 'NOTIFICATION' },
      { key: 'SECURITY_SESSION_TIMEOUT_MINUTES', group: 'SECURITY' }
    ];

    for (const check of keyChecks) {
      const found = settings.find(s => s.key === check.key && s.group === check.group);
      if (found) {
        console.log(`SUCCESS: Found ${check.key} in group ${check.group}`);
      } else {
        console.error(`FAILED: Missing ${check.key} in group ${check.group}`);
      }
    }

  } catch (error) {
    console.error('Verification Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifySettings();
