const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD || require('crypto').randomBytes(16).toString('hex');
  const hashedPassword = await bcrypt.hash(password, 10);

  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log(`[Seed] No SEED_ADMIN_PASSWORD set. Generated password: ${password}`);
    console.log(`[Seed] Set SEED_ADMIN_PASSWORD env var for deterministic seeding.`);
  }
  
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: hashedPassword,
      role: 'ADMIN',
      phoneVerified: true,
      emailVerified: true,
      firstName: 'Admin',
      lastName: 'User',
      phoneNumber: '09000000000'
    },
    create: {
      email,
      passwordHash: hashedPassword,
      role: 'ADMIN',
      phoneVerified: true,
      emailVerified: true,
      firstName: 'Admin',
      lastName: 'User',
      phoneNumber: '09000000000'
    }
  });

  console.log('Admin user created successfully in Admin DB:', user.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
