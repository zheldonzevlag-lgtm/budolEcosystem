const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');

// Ensure we use the correct .env for budolID
require('dotenv').config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD || require('crypto').randomBytes(16).toString('hex');
  const hashedPassword = await bcrypt.hash(password, 10);
  
  console.log(`[Seed] Creating user in SSO DB: ${email}`);
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log(`[Seed] No SEED_ADMIN_PASSWORD set. Generated password: ${password}`);
    console.log(`[Seed] Set SEED_ADMIN_PASSWORD env var for deterministic seeding.`);
  }
  
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      phoneNumber: '09000000000',
      role: 'ADMIN', 
      emailVerified: true,
      phoneVerified: true
    },
    create: {
      email,
      passwordHash: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      phoneNumber: '09000000000',
      role: 'ADMIN',
      emailVerified: true,
      phoneVerified: true
    }
  });

  console.log('✅ User created/updated successfully in SSO DB:', user.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
