const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFetchSettings() {
  try {
    console.log('📡 Fetching SystemSettings...');
    const settings = await prisma.systemSettings.findUnique({
      where: { id: 'default' }
    });
    
    if (settings) {
      console.log('✅ Successfully fetched settings:');
      console.log(`- Realtime Provider: ${settings.realtimeProvider}`);
      console.log(`- SWR Polling Interval: ${settings.swrPollingInterval}`);
      console.log(`- Pusher App ID: ${settings.pusherAppId}`);
    } else {
      console.log('⚠️ No settings found with id "default". Creating one...');
      const newSettings = await prisma.systemSettings.create({
        data: {
          id: 'default',
          realtimeProvider: 'PUSHER',
          pusherAppId: '2090861',
          pusherKey: '7c449017a85bda0ae88a',
          pusherSecret: '2ceb82a5951aa226ce93',
          pusherCluster: 'ap1',
          swrPollingInterval: 10000
        }
      });
      console.log('✅ Created default settings:', newSettings);
    }
  } catch (error) {
    console.error('❌ Error fetching settings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFetchSettings();