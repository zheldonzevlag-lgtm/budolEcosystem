require('dotenv').config({ path: 'd:/IT Projects/budolEcosystem/budolpay-0.1.0/.env' });
const { prisma } = require('d:/IT Projects/budolEcosystem/budolpay-0.1.0/packages/database/index');

async function checkSettings() {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: { group: 'SECURITY' }
    });
    console.log(JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSettings();
