const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'admin@budolpay.com';
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  console.log('Generated hash:', hashedPassword);
  
  await prisma.user.update({
    where: { email },
    data: { passwordHash: hashedPassword }
  });

  const user = await prisma.user.findUnique({ where: { email } });
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  console.log('Verification match:', isMatch);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
