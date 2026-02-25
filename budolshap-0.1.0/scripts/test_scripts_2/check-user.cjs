const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userId = 'cmjs7f3mc0000ccgpxsk7241j';
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  console.log('User in BudolShap:', JSON.stringify(user, null, 2));
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
