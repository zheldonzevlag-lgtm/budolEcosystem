
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://neondb_owner:npg_XLkrx73JNlRP@ep-wandering-breeze-aoin4z9c-pooler.c-2.ap-southeast-1.aws.neon.tech/budolpay?sslmode=require&channel_binding=require&schema=budolpay"
        }
    }
});

async function simulateLogin() {
    console.log('=== TEST 1: Find admin user ===');
    const testEmail = 'ivarhanestad@gmail.com';
    const testPassword = 'B@$t@rd!';
    
    const user = await prisma.user.findFirst({ where: { email: testEmail } });
    console.log('User found:', !!user);
    if (!user) return;
    
    console.log('User role:', user.role);
    console.log('User email verified:', user.emailVerified);
    
    console.log('\n=== TEST 2: Verify password ===');
    const valid = await bcrypt.compare(testPassword, user.passwordHash);
    console.log('Password valid:', valid);
    
    if (!valid) return;
    
    console.log('\n=== TEST 3: Check System Settings ===');
    const settings = await prisma.systemSetting.findMany();
    console.log('Settings found:', settings.length);
    
    console.log('\n=== TESTS PASSED! ===');
}

simulateLogin()
    .catch(err => console.error('ERROR:', err))
    .finally(() => prisma.$disconnect());
