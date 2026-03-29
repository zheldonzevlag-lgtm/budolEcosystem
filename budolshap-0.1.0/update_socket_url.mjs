import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const settings = await prisma.systemSettings.findFirst();
  if (settings) {
    const updated = await prisma.systemSettings.update({
      where: { id: settings.id },
      data: {
        socketUrl: 'https://budol-websocket-server.onrender.com',
      }
    });
    console.log('Successfully updated Socket URL to:', updated.socketUrl);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
