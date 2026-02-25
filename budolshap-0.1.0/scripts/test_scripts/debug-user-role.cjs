const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  try {
    // Checking for both possible admin emails based on previous context and user screenshot
    const emails = ['admin@budolshap.com', 'admin@budolpay.com'];
    
    for (const email of emails) {
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (user) {
        console.log(`✅ Found user: ${email}`, {
          id: user.id,
          email: user.email,
          isAdmin: user.isAdmin,
          accountType: user.accountType,
          role: user.role // Checking if 'role' field exists
        });
      } else {
        console.log(`❌ User not found: ${email}`);
      }
    }
  } catch (error) {
    console.error('❌ Error checking user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
