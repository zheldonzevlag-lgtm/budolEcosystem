
const { PrismaClient } = require('./generated/client');
const prisma = new PrismaClient();

console.log('Checking budolID DB for marijoy@omsmpc.com...');

async function main() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'marijoy@omsmpc.com' },
    });
    console.log('User in budolID:', user);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
