const { PrismaClient } = require('@prisma/client');

async function debugPrisma() {
  const prisma = new PrismaClient();
  console.log('Available models:', Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_')));
  await prisma.$disconnect();
}

debugPrisma();
