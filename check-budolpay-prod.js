require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('=== Checking BudolPay Production Database ===\n');
  
  try {
    // Check connection
    console.log('1. Testing connection...');
    const version = await prisma.$queryRaw`SELECT version()`;
    console.log('   ✅ Connected:', version[0].version.split(' ')[0], '\n');
    
    // List tables
    console.log('2. Listing tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log(`   ✅ Found ${tables.length} tables:`);
    tables.forEach(t => console.log(`      - ${t.table_name}`));
    console.log('');
    
    // Check main tables
    console.log('3. Checking record counts...');
    const counts = {
      User: await prisma.user.count(),
      Wallet: await prisma.wallet.count(),
      Transaction: await prisma.transaction.count(),
      SystemSetting: await prisma.systemSetting.count()
    };
    console.log('   ✅ Counts:');
    Object.entries(counts).forEach(([k, v]) => console.log(`      ${k}: ${v}`));
    console.log('');
    
    // Check SystemSettings
    console.log('4. Checking SystemSettings...');
    const settings = await prisma.systemSetting.findMany({ take: 5 });
    console.log(`   ✅ Found ${settings.length} settings (first 5):`);
    settings.forEach(s => console.log(`      - ${s.key}: ${s.isSecret ? '***' : s.value}`));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
