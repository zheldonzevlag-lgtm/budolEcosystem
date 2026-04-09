const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');

// Ensure we use the correct .env for budolID
require('dotenv').config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();

async function main() {
  const email = 'galvezjon59@gmail.com';
  const password = 'asakapa!';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  console.log(`[Seed] Creating user in SSO DB: ${email}`);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: hashedPassword,
      firstName: 'Jon',
      lastName: 'Galvez',
      phoneNumber: '09123456789',
      role: 'USER', // Default to USER for SSO, admin portal will sync as STAFF/ADMIN
      emailVerified: true,
      phoneVerified: true
    },
    create: {
      email,
      passwordHash: hashedPassword,
      firstName: 'Jon',
      lastName: 'Galvez',
      phoneNumber: '09123456789',
      role: 'USER',
      emailVerified: true,
      phoneVerified: true
    }
  });

  console.log('✅ User created/updated successfully in SSO DB:', user.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
