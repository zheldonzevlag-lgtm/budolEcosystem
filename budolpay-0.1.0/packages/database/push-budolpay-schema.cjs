
// Script to push BudolPay schema to BudolPay DB specifically
const { execSync } = require('child_process');
const path = require('path');

const budolpaySchemaPath = path.join(__dirname, 'prisma/schema.prisma');

const envVars = {
  DATABASE_URL: 'postgresql://neondb_owner:npg_XLkrx73JNlRP@ep-wandering-breeze-aoin4z9c-pooler.c-2.ap-southeast-1.aws.neon.tech/budolpay?sslmode=require&channel_binding=require',
  DIRECT_URL: 'postgresql://neondb_owner:npg_XLkrx73JNlRP@ep-wandering-breeze-aoin4z9c-pooler.c-2.ap-southeast-1.aws.neon.tech/budolpay?sslmode=require&channel_binding=require'
};

console.log('🚀 Pushing BudolPay schema to budolpay DB...');

try {
  // Set environment variables and run prisma db push
  const result = execSync(`npx prisma db push --force-reset`, {
    cwd: __dirname,
    env: { ...process.env, ...envVars },
    stdio: 'inherit'
  });
  
  console.log('\n✅ BudolPay schema pushed successfully!');
} catch (err) {
  console.error('\n❌ Error pushing schema:', err.message);
  process.exit(1);
}
