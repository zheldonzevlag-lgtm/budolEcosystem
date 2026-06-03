
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_XLkrx73JNlRP@ep-wandering-breeze-aoin4z9c-pooler.c-2.ap-southeast-1.aws.neon.tech/budolshap?sslmode=require&channel_binding=require"
    }
  }
});

async function testBudolShapAdminLogin() {
  console.log('=== Testing BudolShap Admin Login ===\n');
  const testEmail = 'ivarhanestad@gmail.com';
  const testPassword = 'B@$t@rd!';

  try {
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    if (!user) {
      console.error('❌ User not found in BudolShap DB!');
      await prisma.$disconnect();
      return;
    }

    console.log('✅ BudolShap User found:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Is Admin: ${user.isAdmin}`);

    const isValid = await bcrypt.compare(testPassword, user.password);
    if (!isValid) {
      console.error('❌ Invalid password!');
      await prisma.$disconnect();
      return;
    }
    console.log('✅ Password verification passed!');

    console.log('');
    console.log('🎉 BudolShap admin login ready!');
    await prisma.$disconnect();
  } catch (err) {
    console.error('❌ Test failed:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testBudolShapAdminLogin();
