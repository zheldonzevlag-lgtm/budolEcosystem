const { PrismaClient } = require('./budolpay-0.1.0/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function upgradeUser() {
  const email = 'reynaldomgalvez@gmail.com';
  console.log(`🚀 Upgrading ${email} to FULLY_VERIFIED...`);

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error(`❌ User ${email} not found in budolPay.`);
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        kycStatus: 'VERIFIED',
        kycTier: 'FULLY_VERIFIED',
        isFaceVerified: true
      }
    });

    console.log(`✅ Success! User ${email} is now fully verified.`);
    console.log(`Status: ${updatedUser.kycStatus}, Tier: ${updatedUser.kycTier}, Face Verified: ${updatedUser.isFaceVerified}`);
  } catch (err) {
    console.error(`❌ Error upgrading user:`, err.message);
  } finally {
    await prisma.$disconnect();
  }
}

upgradeUser();
