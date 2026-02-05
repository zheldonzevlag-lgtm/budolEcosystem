const { PrismaClient } = require('@budolpay/database/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function checkSettings() {
  try {
    const settings = await prisma.systemSettings.findFirst();
    console.log('Current System Settings:');
    console.log('Realtime Provider:', settings?.realtimeProvider || 'Not set');
    console.log('Pusher Key:', settings?.pusherKey || 'Not set');
    console.log('Pusher Cluster:', settings?.pusherCluster || 'Not set');
    console.log('Socket URL:', settings?.socketUrl || 'Not set');
    
    if (settings) {
      console.log('\nFull settings object:');
      console.log(JSON.stringify(settings, null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSettings();