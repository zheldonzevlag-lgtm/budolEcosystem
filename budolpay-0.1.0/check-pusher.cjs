const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPusher() {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: { group: 'REALTIME' }
    });
    console.log('Realtime Settings:');
    console.table(settings.map(s => ({ key: s.key, value: s.value })));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPusher();