const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateSocketUrl() {
  try {
    const localIp = process.env.LOCAL_IP || '192.168.1.17';
    const socketUrl = `http://${localIp}:4000`;
    
    console.log(`Updating REALTIME_SOCKETIO_URL to ${socketUrl}...`);
    
    await prisma.systemSetting.update({
      where: { key: 'REALTIME_SOCKETIO_URL' },
      data: { value: socketUrl }
    });
    
    console.log('✅ Update successful.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSocketUrl();