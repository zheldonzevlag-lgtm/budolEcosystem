const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'admin@budolshap.com';
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  if (user) {
    console.log('User found in budolShap:', {
      email: user.email,
      isAdmin: user.isAdmin,
      id: user.id
    });
  } else {
    console.log('User NOT found in budolShap:', email);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
