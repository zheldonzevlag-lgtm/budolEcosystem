const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userId = '147c50b5-6584-481a-a3e4-739116b2e374';
  const email = 'reynaldomgalvez@gmail.com';

  console.log(`Checking user and wallet for ID: ${userId} (${email})`);

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (user) {
    console.log('User found in budolpay:', {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    });
  } else {
    console.log('User NOT found in budolpay database.');
  }

  const wallet = await prisma.wallet.findUnique({
    where: { userId: userId }
  });

  if (wallet) {
    console.log('Wallet found in budolpay:', {
      userId: wallet.userId,
      balance: wallet.balance,
      currency: wallet.currency
    });
  } else {
    console.log('Wallet NOT found in budolpay database.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
