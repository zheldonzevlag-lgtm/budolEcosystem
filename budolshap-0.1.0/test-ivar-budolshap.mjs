import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_XLkrx73JNlRP@ep-wandering-breeze-aoin4z9c-pooler.c-2.ap-southeast-1.aws.neon.tech/budolshap?sslmode=require&channel_binding=require"
    }
  }
});

async function testLogin() {
  console.log('=== Testing Ivar BudolShap Admin Login ===');
  const testEmail = 'ivarhanestad@gmail.com';
  const testPassword = 'B@$t@rd!';

  const user = await prisma.user.findFirst({ where: { email: testEmail } });

  if (!user) {
    console.error('❌ Admin user not found in BudolShap DB!');
    return;
  }

  console.log('✅ Ivar\'s BudolShap Admin user found');
  console.log('User Data:', {
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin,
    accountType: user.accountType,
    emailVerified: user.emailVerified
  });

  // Verify password hash
  const isValid = await bcrypt.compare(testPassword, user.password);
  console.log('');
  console.log(`Password Verification: ${isValid ? '✅ SUCCESS' : '❌ FAILED'}`);

  if (isValid) {
    console.log('✅ Ivar\'s BudolShap admin login credentials are working!');
  }

  await prisma.$disconnect();
}

testLogin().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
