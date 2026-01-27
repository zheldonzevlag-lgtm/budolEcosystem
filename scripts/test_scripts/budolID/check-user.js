const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'reynaldomgalvez@gmail.com';
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (user) {
    console.log(`User found: ${user.email} (ID: ${user.id})`);
  } else {
    console.log(`User ${email} NOT found.`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
