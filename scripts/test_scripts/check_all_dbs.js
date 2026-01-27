const { PrismaClient } = require('@prisma/client');

async function checkAllDatabases() {
  const dbs = [
    { name: 'budolpay', url: "postgresql://postgres:r00t@localhost:5432/budolpay?schema=public" },
    { name: 'budolshap_1db', url: "postgresql://postgres:r00t@localhost:5432/budolshap_1db?schema=public" },
    { name: 'budolid', url: "postgresql://postgres:r00t@localhost:5432/budolid?schema=public" }
  ];

  for (const db of dbs) {
    console.log(`\n--- Checking Database: ${db.name} ---`);
    const prisma = new PrismaClient({
      datasources: { db: { url: db.url } }
    });

    try {
      const userCount = await prisma.user.count();
      console.log(`User Count: ${userCount}`);
      
      const peter = await prisma.user.findFirst({
        where: {
          OR: [
            { firstName: { contains: 'Peter', mode: 'insensitive' } },
            { lastName: { contains: 'Parker', mode: 'insensitive' } },
            { phoneNumber: { contains: 'Peter', mode: 'insensitive' } }
          ]
        }
      });

      if (peter) {
        console.log(`FOUND Peter Parker in ${db.name}:`, JSON.stringify(peter, null, 2));
      } else {
        console.log(`Peter Parker NOT found in ${db.name}`);
      }
    } catch (e) {
      console.error(`Error checking ${db.name}:`, e.message);
    } finally {
      await prisma.$disconnect();
    }
  }
}

checkAllDatabases();
