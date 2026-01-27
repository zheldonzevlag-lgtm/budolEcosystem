const { PrismaClient } = require('./budolpay-0.1.0/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userId = 'ad12dbcd-be7d-4ae6-8163-93d9d741971c';
  const wallet = await prisma.wallet.findUnique({
    where: { userId }
  });
  console.log('Wallet:', JSON.stringify(wallet, null, 2));
  
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  console.log('User:', JSON.stringify(user, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
