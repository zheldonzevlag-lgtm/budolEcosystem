const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  const user = await prisma.user.findUnique({
    where: { email: 'tony.stark@budolshap.com' },
    include: { store: true }
  });
  console.log('User:', JSON.stringify(user, null, 2));
  process.exit(0);
}

checkUser().catch(err => {
  console.error(err);
  process.exit(1);
});
