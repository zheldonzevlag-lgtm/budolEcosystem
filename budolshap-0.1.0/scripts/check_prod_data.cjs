const { PrismaClient } = require('@prisma/client');

async function main() {
  const url = "postgres://c0999becfdd24a3fdf0c431059e54af5b7f61cedbdd336a0c0b9ead004aa22bc:sk_m8mN6a7H1RaICj0gOw19i@db.prisma.io:5432/postgres?sslmode=require";
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: url,
      },
    },
  });

  try {
    console.log('🧐 Auditing product availability...');
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        inStock: true,
        stock: true,
        storeId: true
      }
    });

    console.table(products);

    const storeCount = await prisma.store.count();
    console.log(`🏪 Total Stores: ${storeCount}`);
    
    if (storeCount > 0) {
        const stores = await prisma.store.findMany({
            select: { id: true, name: true, isActive: true }
        });
        console.table(stores);
    }

  } catch (error) {
    console.error('❌ Audit Failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
