const { prisma } = require('./budolpay-0.1.0/packages/database/index.js');

async function checkRealtimeSettings() {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        group: 'REALTIME'
      }
    });

    console.log('Current Real-time Settings:');
    console.log('===========================');
    settings.forEach(setting => {
      console.log(`${setting.key}: ${setting.value}`);
    });

    if (settings.length === 0) {
      console.log('No REALTIME settings found. Using defaults.');
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error checking settings:', error);
    await prisma.$disconnect();
  }
}

checkRealtimeSettings();