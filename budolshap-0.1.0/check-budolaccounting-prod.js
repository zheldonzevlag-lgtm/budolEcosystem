const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_XLkrx73JNlRP@ep-wandering-breeze-aoin4z9c-pooler.c-2.ap-southeast-1.aws.neon.tech/budolaccounting?sslmode=require&channel_binding=require"
    }
  }
});

async function main() {
  console.log('=== Checking BudolAccounting Production Database ===\n');
  
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
      ChartOfAccount: await prisma.chartOfAccount.count(),
      LedgerEntry: await prisma.ledgerEntry.count()
    };
    console.log('   ✅ Counts:');
    Object.entries(counts).forEach(([k, v]) => console.log(`      ${k}: ${v}`));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
