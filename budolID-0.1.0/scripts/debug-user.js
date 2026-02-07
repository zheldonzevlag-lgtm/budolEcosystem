const { PrismaClient } = require('../generated/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:r00t@localhost:5432/budolshap_1db?schema=public'
    }
  }
});

async function main() {
  console.log('Searching for 9484099400 in public schema...');
  const users = await prisma.$queryRawUnsafe(
    'SELECT id, "phoneNumber", email, name FROM "public"."User" WHERE "phoneNumber" LIKE \'%9484099400%\''
  );
  console.log('Found users:', JSON.stringify(users, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
