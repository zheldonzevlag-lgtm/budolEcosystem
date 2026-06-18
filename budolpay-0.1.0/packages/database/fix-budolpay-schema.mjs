import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbUrl = "postgresql://neondb_owner:npg_XLkrx73JNlRP@ep-wandering-breeze-aoin4z9c-pooler.c-2.ap-southeast-1.aws.neon.tech/budolpay?sslmode=require&channel_binding=require&schema=budolpay";
const directUrl = "postgresql://neondb_owner:npg_XLkrx73JNlRP@ep-wandering-breeze-aoin4z9c-pooler.c-2.ap-southeast-1.aws.neon.tech/budolpay?sslmode=require&channel_binding=require&schema=budolpay";

async function setupDB() {
  console.log('=== Setting up BudolPay Database ===');
  
  // Step 1: First, create the schema using a temporary client without schema specified
  const tempPrisma = new PrismaClient({ datasources: { db: { url: dbUrl.replace('&schema=budolpay', '') } } });
  
  console.log('Creating budolpay schema...');
  await tempPrisma.$executeRaw`CREATE SCHEMA IF NOT EXISTS budolpay;`;
  await tempPrisma.$disconnect();
  console.log('✅ Schema created');
  
  console.log('Pushing Prisma schema to budolpay schema...');
  const result = execSync('npx prisma db push --force-reset', { 
    env: { ...process.env, DATABASE_URL: dbUrl, DIRECT_URL: directUrl },
    cwd: __dirname,
    stdio: 'inherit'
  });
  
  console.log('✅ Prisma schema pushed');
  
  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  
  // Step 2: Add basic SystemSettings
  console.log('Adding SystemSettings...');
  const settings = [
    { key: 'SECURITY_RATE_LIMIT_AUTH', value: '5', description: 'Max login attempts per IP' },
    { key: 'OTP_LENGTH', value: '6', description: 'Length of generated OTP codes' },
    { key: 'OTP_EXPIRY_MINUTES', value: '10', description: 'OTP code expiry in minutes' },
    { key: 'EMAIL_PROVIDER', value: 'CONSOLE', description: 'Email provider (CONSOLE, SMTP, etc.)' },
    { key: 'SMS_PROVIDER', value: 'CONSOLE', description: 'SMS provider (CONSOLE, TWILIO, etc.)' }
  ];
  
  for(const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: setting,
      create: setting
    });
  }
  console.log('✅ SystemSettings added');
  
  // Step3: Recreate Ivar's admin in budolpay schema
  console.log('Adding Ivar Hanestad as admin...');
  const bcrypt = (await import('bcryptjs')).default;
  const crypto = await import('crypto');
  
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('B@$t@rd!', salt);
  
  const user = await prisma.user.upsert({
    where: { email: 'ivarhanestad@gmail.com' },
    update: {
      passwordHash: hashedPassword,
      role: 'ADMIN',
      phoneVerified: true,
      emailVerified: true,
      firstName: 'Ivar',
      lastName: 'Hanestad',
      phoneNumber: '09198765432'
    },
    create: {
      id: crypto.randomUUID(),
      email: 'ivarhanestad@gmail.com',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      phoneVerified: true,
      emailVerified: true,
      firstName: 'Ivar',
      lastName: 'Hanestad',
      phoneNumber: '09198765432'
    }
  });
  console.log('✅ Ivar added to budolpay schema!');
  
  await prisma.$disconnect();
  console.log('=== Setup Complete ===');
}

setupDB().catch(err => { console.error('❌ Error:', err); process.exit(1); });
