const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkModels() {
  console.log('--- Prisma Models ---');
  const models = Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_'));
  console.log(models);
  
  if (models.includes('user')) {
    console.log('User model is available');
  } else {
    console.log('User model is NOT available');
  }
  
  await prisma.$disconnect();
}

checkModels().catch(console.error);
