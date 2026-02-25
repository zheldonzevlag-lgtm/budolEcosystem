const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updatePusherCredentials() {
  try {
    console.log('Updating Pusher credentials...');
    
    // Update existing settings with real Pusher credentials
    const updatedSettings = await prisma.systemSettings.update({
      where: { id: 'default' },
      data: {
        realtimeProvider: 'PUSHER',
        pusherAppId: '2090861',
        pusherKey: '7c449017a85bda0ae88a',
        pusherSecret: '2ceb82a5951aa226ce93',
        pusherCluster: 'ap1'
      }
    });
    
    console.log('✅ Pusher credentials updated successfully!');
    console.log('Realtime Provider:', updatedSettings.realtimeProvider);
    console.log('Pusher App ID:', updatedSettings.pusherAppId);
    console.log('Pusher Key:', updatedSettings.pusherKey);
    console.log('Pusher Cluster:', updatedSettings.pusherCluster);
    
  } catch (error) {
    console.error('❌ Error updating Pusher credentials:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePusherCredentials();