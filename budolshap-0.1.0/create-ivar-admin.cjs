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

const email = "ivarhanestad@gmail.com";
const password = "B@$t@rd!";
const name = "Ivar Hanestad";

async function main() {
  console.log('Updating BudolShap admin...');
  
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
    console.log('✅ BudolShap Admin updated:', existing.email);
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
        image: ""
      }
    });
    console.log('✅ BudolShap Admin created:', email);
  }
}

main()
  .catch(err => { console.error('❌ Error:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
