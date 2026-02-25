const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updatePusherCredentials() {
  try {
    console.log('Updating Pusher credentials...');
    
    // First, let's check if settings exist
    const existingSettings = await prisma.systemSettings.findUnique({
      where: { id: 'default' }
    });
    
    if (existingSettings) {
      console.log('Found existing settings, updating...');
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
      console.log('✅ Updated existing settings');
    } else {
      console.log('Creating new settings...');
      const newSettings = await prisma.systemSettings.create({
        data: {
          id: 'default',
          realtimeProvider: 'PUSHER',
          pusherAppId: '2090861',
          pusherKey: '7c449017a85bda0ae88a',
          pusherSecret: '2ceb82a5951aa226ce93',
          pusherCluster: 'ap1'
        }
      });
      console.log('✅ Created new settings');
    }
    
    // Verify the update
    const finalSettings = await prisma.systemSettings.findUnique({
      where: { id: 'default' }
    });
    
    console.log('\n✅ Pusher credentials updated successfully!');
    console.log('Realtime Provider:', finalSettings.realtimeProvider);
    console.log('Pusher App ID:', finalSettings.pusherAppId);
    console.log('Pusher Key:', finalSettings.pusherKey);
    console.log('Pusher Cluster:', finalSettings.pusherCluster);
    
  } catch (error) {
    console.error('❌ Error updating Pusher credentials:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePusherCredentials();