
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_XLkrx73JNlRP@ep-wandering-breeze-aoin4z9c-pooler.c-2.ap-southeast-1.aws.neon.tech/budolshap?sslmode=require&channel_binding=require"
    }
  }
});

const email = "admin@budolshap.com";
const password = "admin123";
const name = "Super Admin";

async function main() {
  console.log('Updating production admin...');
  
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(password, salt);
  
  const existing = await prisma.user.findFirst({ where: { email } });
  
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        password: hash,
        isAdmin: true,
        accountType: "ADMIN",
        emailVerified: true,
        name
      }
    });
    console.log('✅ Admin updated:', existing.email);
  } else {
    await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email,
        password: hash,
        isAdmin: true,
        accountType: "ADMIN",
        emailVerified: true,
        name,
        image: ''
      }
    });
    console.log('✅ Admin created:', email);
  }
}

main()
  .catch(err => { console.error('❌ Error:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
