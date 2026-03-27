const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('✅ Connection successful!');
    const users = await prisma.user.count();
    console.log(`📊 Total users in DB: ${users}`);
  } catch (err) {
    console.error('❌ Connection failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
