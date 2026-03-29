const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const settings = await prisma.systemSettings.findFirst();
  console.log('Socket URL:', settings?.socketUrl);
  console.log('Realtime Provider:', settings?.realtimeProvider);
}
main().catch(console.error).finally(() => prisma.$disconnect());
