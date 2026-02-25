const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAdmin() {
  try {
    const email = 'admin@budolpay.com';
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (user) {
      console.log(`✅ Found user: ${email}. Updating to ADMIN...`);
      await prisma.user.update({
        where: { email },
        data: {
          isAdmin: true,
          accountType: 'ADMIN'
        }
      });
      console.log(`✅ User ${email} updated to ADMIN successfully.`);
    } else {
      console.log(`❌ User not found: ${email}. Creating as ADMIN...`);
      // If user doesn't exist, we'll let SSO create it, but it's better to fix the SSO callback logic too.
      // For now, let's just create it if the user wants it fixed immediately.
      await prisma.user.create({
        data: {
          id: `sso_${Math.random().toString(36).substring(2, 15)}`,
          email: email,
          name: 'Budol Admin',
          phoneNumber: `sso_${Math.random().toString(36).substring(2, 10)}`,
          password: 'SSO_MANAGED_USER',
          accountType: 'ADMIN',
          isAdmin: true,
          emailVerified: true
        }
      });
      console.log(`✅ User ${email} created as ADMIN successfully.`);
    }
  } catch (error) {
    console.error('❌ Error fixing admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdmin();
