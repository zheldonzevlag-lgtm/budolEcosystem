/**
 * Push Prisma schema to Vercel database
 */
const { execSync } = require('child_process');

const VERCEL_DB_URL = 'postgres://c0999becfdd24a3fdf0c431059e54af5b7f61cedbdd336a0c0b9ead004aa22bc:sk_m8mN6a7H1RaICj0gOw19i@db.prisma.io:5432/postgres?sslmode=require';

console.log('🔄 Pushing schema to Vercel database...\n');

try {
  // Set the DATABASE_URL and push
  process.env.DATABASE_URL = VERCEL_DB_URL;
  
  execSync('npx prisma db push', {
    cwd: 'budolshap-0.1.0',
    env: { ...process.env, DATABASE_URL: VERCEL_DB_URL },
    stdio: 'inherit'
  });
  
  console.log('\n✅ Schema pushed successfully!');
} catch (error) {
  console.error('\n❌ Error pushing schema:', error.message);
  process.exit(1);
}