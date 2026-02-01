const { PrismaClient } = require('./generated/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function createAdminAccounts() {
  const admins = [
    {
      email: 'reynaldomgalvez@gmail.com',
      password: 'tr@1t0r',
      firstName: 'Reynaldo',
      lastName: 'Galvez',
      role: 'ADMIN'
    },
    {
      email: 'admin@budolpay.com',
      password: 'admin123',
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN'
    }
  ];

  console.log('--- Creating/Updating Admin Accounts ---');
  
  for (const admin of admins) {
    const hashedPassword = await bcrypt.hash(admin.password, 10);
    
    const user = await prisma.user.upsert({
      where: { email: admin.email },
      update: {
        password: hashedPassword,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
        isVerified: true
      },
      create: {
        email: admin.email,
        password: hashedPassword,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
        isVerified: true
      }
    });
    
    console.log(`✅ Account ${admin.email} is ready with role ${admin.role}`);
  }
  
  console.log('--- Done ---');
}

createAdminAccounts()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
