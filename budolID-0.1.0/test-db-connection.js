require('dotenv').config();
const { PrismaClient } = require('./generated/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const apps = await prisma.ecosystemApp.findMany();
    console.log('Successfully found apps in budolid schema:', apps.length);
  } catch (e) {
    console.error('Failed to find apps in budolid schema:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
check();