const { PrismaClient } = require('@prisma/client');

async function listUsersBudolShap() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres:r00t@localhost:5432/budolshap_1db?schema=public"
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
    console.log('--- BUDOLSHAP USERS ---');
    console.log(JSON.stringify(users, null, 2));
    console.log('-----------------------');
  } catch (error) {
    console.error('Error listing BudolShap users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsersBudolShap();
