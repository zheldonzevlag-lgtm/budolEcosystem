const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@budolshap.com' }
    });

    if (user) {
      console.log('✅ Found admin user in budolShap:', {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
        accountType: user.accountType
      });

      if (!user.isAdmin || user.accountType !== 'ADMIN') {
        console.log('⚠️ User exists but is not an admin. Updating...');
        await prisma.user.update({
          where: { email: 'admin@budolshap.com' },
          data: {
            isAdmin: true,
            accountType: 'ADMIN'
          }
        });
        console.log('✅ User updated to ADMIN in budolShap');
      }
    } else {
      console.log('ℹ️ Admin user not found in budolShap. It will be created upon first SSO login.');
    }
  } catch (error) {
    console.error('❌ Error checking admin in budolShap:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
