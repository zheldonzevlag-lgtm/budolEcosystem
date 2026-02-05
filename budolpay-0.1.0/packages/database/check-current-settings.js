const { prisma } = require('./index.js');

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
    } else {
      console.log('\nNo settings found in database. Creating default settings...');
      
      // Create default settings with Pusher credentials
      const defaultSettings = await prisma.systemSettings.create({
        data: {
          realtimeProvider: 'PUSHER',
          pusherKey: '7c449017a85bda0ae88a',
          pusherCluster: 'ap1',
          socketUrl: 'http://192.168.1.2:8080'
        }
      });
      
      console.log('Created default settings with Pusher credentials:');
      console.log(JSON.stringify(defaultSettings, null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSettings();