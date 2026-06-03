const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_XLkrx73JNlRP@ep-wandering-breeze-aoin4z9c-pooler.c-2.ap-southeast-1.aws.neon.tech/budolpay?sslmode=require&channel_binding=require"
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