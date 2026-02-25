const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updatePusherCredentials() {
  try {
    console.log('Updating Pusher credentials using raw SQL...');
    
    // Use raw SQL to update only the specific columns
    const result = await prisma.$executeRaw`
      UPDATE "SystemSettings" 
      SET 
        "realtimeProvider" = 'PUSHER',
        "pusherAppId" = '2090861',
        "pusherKey" = '7c449017a85bda0ae88a',
        "pusherSecret" = '2ceb82a5951aa226ce93',
        "pusherCluster" = 'ap1'
      WHERE id = 'default'
    `;
    
    console.log('✅ Raw SQL update result:', result);
    
    // Verify the update
    const updatedSettings = await prisma.$queryRaw`
      SELECT "realtimeProvider", "pusherAppId", "pusherKey", "pusherCluster" 
      FROM "SystemSettings" 
      WHERE id = 'default'
    `;
    
    console.log('\n✅ Pusher credentials updated successfully!');
    console.log('Realtime Provider:', updatedSettings[0].realtimeProvider);
    console.log('Pusher App ID:', updatedSettings[0].pusherAppId);
    console.log('Pusher Key:', updatedSettings[0].pusherKey);
    console.log('Pusher Cluster:', updatedSettings[0].pusherCluster);
    
  } catch (error) {
    console.error('❌ Error updating Pusher credentials:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePusherCredentials();