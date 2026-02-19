const { PrismaClient } = require('./generated/client');
const prisma = new PrismaClient();

console.log('Starting ALL check...');

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, firstName: true, lastName: true },
  });
  console.log('All Users:', JSON.stringify(users, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
