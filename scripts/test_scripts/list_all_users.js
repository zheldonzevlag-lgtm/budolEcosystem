const { prisma } = require('../../budolpay-0.1.0/packages/database/index.js');

async function listUsers() {
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
    console.log('--- ALL USERS ---');
    console.log(JSON.stringify(users, null, 2));
    console.log('-----------------');
  } catch (error) {
    console.error('Error listing users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
