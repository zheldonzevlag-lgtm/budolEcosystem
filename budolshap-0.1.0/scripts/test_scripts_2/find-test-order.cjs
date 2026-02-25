const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING PRISMA QUERY ---');
  try {
    const order = await prisma.order.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { id: true, total: true, status: true, isPaid: true }
    });
    
    if (order) {
      console.log('FOUND_ORDER:' + JSON.stringify(order));
    } else {
      console.log('NO_ORDER_FOUND');
    }
  } catch (err) {
    console.error('PRISMA_ERROR:', err.message);
  }
  console.log('--- FINISHED PRISMA QUERY ---');
}

main()
  .catch(e => {
    console.error('GLOBAL_ERROR:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
