const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const app = await prisma.ecosystemApp.findUnique({
    where: { name: 'budolShap' }
  });
  console.log('budolShap App:', app);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
