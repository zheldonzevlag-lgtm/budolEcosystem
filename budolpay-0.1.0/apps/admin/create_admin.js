const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'galvezjon59@gmail.com';
  const password = 'adm1n1str@1t0r';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: hashedPassword,
      role: 'ADMIN',
      phoneVerified: true,
      emailVerified: true,
      firstName: 'Jon',
      lastName: 'Galvez',
      phoneNumber: '09123456789'
    },
    create: {
      email,
      passwordHash: hashedPassword,
      role: 'ADMIN',
      phoneVerified: true,
      emailVerified: true,
      firstName: 'Jon',
      lastName: 'Galvez',
      phoneNumber: '09123456789'
    }
  });

  console.log('Admin user created successfully in Admin DB:', user.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
