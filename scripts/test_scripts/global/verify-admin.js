const path = require('path');
const { PrismaClient: PrismaPay } = require(path.resolve(__dirname, 'budolpay-0.1.0', 'node_modules', '@prisma/client'));
const { PrismaClient: PrismaShap } = require(path.resolve(__dirname, 'budolshap-0.1.0', 'node_modules', '@prisma/client'));

async function check() {
  const email = 'galvezjon59@gmail.com';
  
  const prismaPay = new PrismaPay({
    datasources: { db: { url: 'postgresql://postgres:r00t@localhost:5432/budolpay?schema=public' } }
  });
  
  const prismaShap = new PrismaShap({
    datasources: { db: { url: 'postgresql://postgres:r00t@localhost:5432/budolshap_1db?schema=public' } }
  });

  const userPay = await prismaPay.user.findUnique({ where: { email } });
  const userShap = await prismaShap.user.findUnique({ where: { email } });

  console.log('--- VERIFICATION ---');
  console.log('User:', email);
  console.log('BudolPay Admin:', userPay && userPay.role === 'ADMIN' ? '✅ YES' : '❌ NO');
  console.log('BudolShap Admin:', userShap && (userShap.accountType === 'ADMIN' && userShap.isAdmin === true) ? '✅ YES' : '❌ NO');
  console.log('--------------------');

  await prismaPay.$disconnect();
  await prismaShap.$disconnect();
}
check();
