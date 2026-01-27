const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'reynaldomgalvez@gmail.com' } });
  console.log(user ? user.id : 'User not found');
}
main().finally(() => prisma.$disconnect());
