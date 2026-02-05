const { prisma } = require('./packages/database/index.js');

async function updatePusherSettings() {
  try {
    console.log('Updating Pusher settings...');
    
    // Update or create Pusher settings
    const settings = [
      { key: 'REALTIME_PUSHER_APP_ID', value: '2090861', group: 'REALTIME' },
      { key: 'REALTIME_PUSHER_KEY', value: '7c449017a85bda0ae88a', group: 'REALTIME' },
      { key: 'REALTIME_PUSHER_SECRET', value: '2ceb82a5951aa226ce93', group: 'REALTIME' },
      { key: 'REALTIME_PUSHER_CLUSTER', value: 'ap1', group: 'REALTIME' }
    ];
    
    for (const setting of settings) {
      await prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: setting
      });
      console.log(`✅ Updated ${setting.key}: ${setting.value}`);
    }
    
    console.log('🔄 Switching to Pusher method...');
    await prisma.systemSetting.upsert({
      where: { key: 'REALTIME_METHOD' },
      update: { value: 'PUSHER' },
      create: { key: 'REALTIME_METHOD', value: 'PUSHER', group: 'REALTIME' }
    });
    
    console.log('✅ Pusher settings updated successfully!');
    console.log('🎯 Real-time method switched to PUSHER');
    
  } catch (error) {
    console.error('❌ Error updating settings:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updatePusherSettings();