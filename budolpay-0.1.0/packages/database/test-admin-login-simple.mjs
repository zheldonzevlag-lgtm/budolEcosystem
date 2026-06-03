import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_XLkrx73JNlRP@ep-wandering-breeze-aoin4z9c-pooler.c-2.ap-southeast-1.aws.neon.tech/budolpay?sslmode=require&channel_binding=require"
    }
  }
});

async function testLogin() {
  console.log('=== Testing BudolPay Admin Login ===');
  const testEmail = 'galvezjon59@gmail.com';
  const testPassword = 'adm1n1str@1t0r';

  const user = await prisma.user.findFirst({ where: { email: testEmail } });

  if (!user) {
    console.error('❌ Admin user not found in DB!');
    return;
  }

  console.log('✅ Admin user found in DB');
  console.log('User Data:', {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified
  });

  // Verify password hash
  const isValid = await bcrypt.compare(testPassword, user.passwordHash);
  console.log('');
  console.log(`Password Verification: ${isValid ? '✅ SUCCESS' : '❌ FAILED'}`);

  if (isValid) {
    console.log('✅ BudolPay admin login credentials are working!');
  }

  await prisma.$disconnect();
}

testLogin().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
