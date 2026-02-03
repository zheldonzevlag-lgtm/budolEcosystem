const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Listing all databases...');
    const databases = await prisma.$queryRaw`
      SELECT datname FROM pg_database WHERE datistemplate = false;
    `;
    console.log('Databases:', databases);

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
