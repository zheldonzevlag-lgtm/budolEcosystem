const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');

// Ensure we use the correct .env for budolID
require('dotenv').config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();

async function main() {
  const email = 'reynaldomgalvez@gmail.com';
  const password = 'tr@1t0r!';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  console.log(`[Seed] Creating user in SSO DB: ${email}`);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: hashedPassword,
      firstName: 'Reynaldo',
      lastName: 'Galvez',
      phoneNumber: '09484099388',
      role: 'ADMIN', 
      emailVerified: true,
      phoneVerified: true
    },
    create: {
      email,
      passwordHash: hashedPassword,
      firstName: 'Reynaldo',
      lastName: 'Galvez',
      phoneNumber: '09484099388',
      role: 'ADMIN',
      emailVerified: true,
      phoneVerified: true
    }
  });

  console.log('✅ User created/updated successfully in SSO DB:', user.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
