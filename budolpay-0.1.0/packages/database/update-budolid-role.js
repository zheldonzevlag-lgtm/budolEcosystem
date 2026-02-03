const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:r00t@localhost:5432/budolshap_1db?schema=budolid"
    }
  }
});

async function main() {
  const email = 'reynaldomgalvez@gmail.com';
  try {
    console.log(`Updating ${email} in budolshap_1db.budolid.User...`);
    const result = await prisma.$executeRaw`
      UPDATE "budolid"."User" SET role = 'ADMIN' WHERE email = ${email}
    `;
    console.log('Update result:', result);
    
    const user = await prisma.$queryRaw`
      SELECT id, email, role FROM "budolid"."User" WHERE email = ${email}
    `;
    console.log('Verified user:', user);
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
