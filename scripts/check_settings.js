const { prisma } = require('../budolpay-0.1.0/packages/database');

async function checkSettings() {
  try {
    const settings = await prisma.systemSetting.findMany();
    console.log('System Settings:', JSON.stringify(settings, null, 2));
  } catch (err) {
    console.error('Error fetching settings:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkSettings();
