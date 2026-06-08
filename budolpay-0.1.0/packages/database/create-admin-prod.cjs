require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '&channel_binding=require'
    }
  }
});

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
      id: crypto.randomUUID(),
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

  console.log('✅ BudolPay Admin user created/updated:', user.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());