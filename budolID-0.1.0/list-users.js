const { PrismaClient } = require('./generated/client');
const prisma = new PrismaClient();

async function listUsers() {
  console.log('--- Listing budolID Users ---');
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      firstName: true,
      lastName: true
    }
  });
  console.table(users);
  console.log('--- End of List ---');
}

listUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
