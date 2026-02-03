const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:r00t@localhost:5432/budolpay?schema=public"
    }
  }
});

async function main() {
  const email = 'reynaldomgalvez@gmail.com';
  
  try {
    console.log(`Updating ${email} to ADMIN in budolpay database using raw query...`);
    
    const result = await prisma.$executeRaw`
      UPDATE "User" SET role = 'ADMIN' WHERE email = ${email};
    `;
    
    console.log('Update successful, rows affected:', result);

    // Verify update
    const user = await prisma.$queryRaw`
      SELECT id, email, role FROM "User" WHERE email = ${email};
    `;
    console.log('Verified user:', user);

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
