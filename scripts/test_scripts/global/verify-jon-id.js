const { PrismaClient } = require('./budolID-0.1.0/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function verifyIdUser() {
  const email = 'reynaldomgalvez@gmail.com';
  console.log(`🚀 Verifying ${email} in budolID...`);

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error(`❌ User ${email} not found in budolID.`);
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        isVerified: true
      }
    });

    console.log(`✅ Success! User ${email} is now verified in budolID.`);
    console.log(`Verified Status: ${updatedUser.isVerified}`);
  } catch (err) {
    console.error(`❌ Error verifying user:`, err.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyIdUser();
