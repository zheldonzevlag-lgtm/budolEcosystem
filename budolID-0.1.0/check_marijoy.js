const { PrismaClient } = require('./generated/client');
const prisma = new PrismaClient();

console.log('Starting check...');

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, firstName: true, lastName: true },
  });
  console.log('Users:', users);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
