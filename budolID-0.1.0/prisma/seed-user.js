const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@budolpay.com' },
    update: { passwordHash: hashedPassword },
    create: {
      email: 'admin@budolpay.com',
      passwordHash: hashedPassword,
      firstName: 'Budol',
      lastName: 'Admin',
      role: 'USER'
    }
  });

  console.log('Test user created in budolID');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
