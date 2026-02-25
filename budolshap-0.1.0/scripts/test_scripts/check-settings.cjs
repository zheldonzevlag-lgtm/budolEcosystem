const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function checkEmailSettings() {
  try {
    const settings = await prisma.systemSettings.findUnique({
      where: { id: 'default' }
    });
    
    if (!settings) {
      console.log('❌ No system settings found with ID "default"');
      return;
    }

    console.log('--- System Settings ---');
    Object.entries(settings).forEach(([key, value]) => {
      if (key.toLowerCase().includes('key') || key.toLowerCase().includes('secret') || key.toLowerCase().includes('pass')) {
        console.log(`${key}: ${value ? '********' + value.slice(-4) : 'null'}`);
      } else {
        console.log(`${key}: ${value}`);
      }
    });

    console.log('\n--- Environment Variables (Fallback) ---');
    console.log(`SMTP_USER: ${process.env.SMTP_USER}`);
    console.log(`SMTP_PASS: ${process.env.SMTP_PASS ? '********' + process.env.SMTP_PASS.slice(-4) : 'undefined'}`);
    console.log(`BUDOLPAY_API_KEY: ${process.env.BUDOLPAY_API_KEY ? '********' + process.env.BUDOLPAY_API_KEY.slice(-4) : 'undefined'}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmailSettings();
