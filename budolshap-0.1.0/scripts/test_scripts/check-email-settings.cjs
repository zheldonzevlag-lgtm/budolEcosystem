const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSettings() {
  try {
    const settings = await prisma.systemSettings.findMany();
    console.log('--- System Settings ---');
    console.log(JSON.stringify(settings, null, 2));
    
    const emailSettings = settings.filter(s => s.group === 'email' || s.key.includes('email') || s.key.includes('smtp'));
    console.log('\n--- Email Settings ---');
    console.log(JSON.stringify(emailSettings, null, 2));
  } catch (error) {
    console.error('Error fetching settings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSettings();
