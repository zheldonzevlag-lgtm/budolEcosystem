const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:r00t@localhost:5432/budolShap?schema=public"
    }
  }
});

async function main() {
  const email = 'reynaldomgalvez@gmail.com';
  try {
    const user = await prisma.$queryRaw`SELECT * FROM "User" WHERE email = ${email}`;
    console.log(JSON.stringify(user, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
