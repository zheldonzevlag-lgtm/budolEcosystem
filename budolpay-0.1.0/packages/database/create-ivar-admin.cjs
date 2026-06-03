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

const email = "ivarhanestad@gmail.com";
const password = "B@$t@rd!";
const firstName = "Ivar";
const lastName = "Hanestad";
const phoneNumber = "09198765432";

async function main() {
  console.log('Updating BudolPay admin...');

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: hashedPassword,
      role: 'ADMIN',
      phoneVerified: true,
      emailVerified: true,
      firstName,
      lastName,
      phoneNumber
    },
    create: {
      id: crypto.randomUUID(),
      email,
      passwordHash: hashedPassword,
      role: 'ADMIN',
      phoneVerified: true,
      emailVerified: true,
      firstName,
      lastName,
      phoneNumber
    }
  });

  console.log('✅ BudolPay Admin created/updated:', user.email);
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); }).finally(() => prisma.$disconnect());
