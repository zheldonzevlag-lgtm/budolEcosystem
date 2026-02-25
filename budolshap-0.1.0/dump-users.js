const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      isAdmin: true,
      role: true,
      accountType: true
    }
  });
  console.log('Users in Database:');
  console.log(JSON.stringify(users, null, 2));

  const stores = await prisma.store.findMany({
    select: {
      id: true,
      name: true,
      status: true,
      verificationStatus: true
    }
  });
  console.log('\nStores in Database:');
  console.log(JSON.stringify(stores, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
