
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_XLkrx73JNlRP@ep-wandering-breeze-aoin4z9c-pooler.c-2.ap-southeast-1.aws.neon.tech/budolpay?sslmode=require&channel_binding=require&schema=budolpay"
    }
  }
});

async function testAdminLogin() {
  console.log('=== Testing BudolPay Admin Login ===\n');
  const testEmail = 'ivarhanestad@gmail.com';
  const testPassword = 'B@$t@rd!';

  try {
    // 1. Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: testEmail }
    });

    if (!user) {
      console.error('❌ User not found in database!');
      await prisma.$disconnect();
      return;
    }

    console.log('✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   First Name: ${user.firstName}`);
    console.log(`   Last Name: ${user.lastName}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Email Verified: ${user.emailVerified}`);
    console.log(`   Phone Verified: ${user.phoneVerified}`);
    console.log('');

    // 2. Check password
    const isValidPassword = await bcrypt.compare(testPassword, user.passwordHash);
    if (!isValidPassword) {
      console.error('❌ Invalid password!');
      await prisma.$disconnect();
      return;
    }
    console.log('✅ Password verification passed!');
    console.log('');

    // 3. Check system settings exist
    const settings = await prisma.systemSetting.findMany();
    console.log('✅ System settings found:', settings.length);

    console.log('');
    console.log('🎉 All tests passed! Admin login should work perfectly!');
    console.log('   (Once deployed, you will get an OTP which will be logged to server console)');

    await prisma.$disconnect();
  } catch (err) {
    console.error('❌ Test failed:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testAdminLogin();
