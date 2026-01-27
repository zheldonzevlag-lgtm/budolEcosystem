const { PrismaClient } = require('@prisma/client');

async function checkBudolID() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres:r00t@localhost:5432/budolid?schema=public"
      }
    }
  });

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        email: true
      }
    });
    console.log('--- BUDOLID USERS ---');
    console.log(JSON.stringify(users, null, 2));
    console.log('-----------------------');
  } catch (error) {
    console.error('Error checking BudolID:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkBudolID();
