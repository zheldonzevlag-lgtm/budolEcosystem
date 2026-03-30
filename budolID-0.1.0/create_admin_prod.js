const { PrismaClient } = require('./generated/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_1XunT0SskIwa@ep-bitter-wildflower-a1y0z1id-pooler.ap-southeast-1.aws.neon.tech/budolpay?sslmode=require&schema=budolid"
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
      password: hashedPassword,
      role: 'ADMIN',
      isVerified: true,
      firstName: 'Jon',
      lastName: 'Galvez',
      phoneNumber: '09123456789'
    },
    create: {
      email,
      password: hashedPassword,
      role: 'ADMIN',
      isVerified: true,
      firstName: 'Jon',
      lastName: 'Galvez',
      phoneNumber: '09123456789'
    }
  });

  console.log('Admin user created successfully in Prod BudolID DB:', user.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
