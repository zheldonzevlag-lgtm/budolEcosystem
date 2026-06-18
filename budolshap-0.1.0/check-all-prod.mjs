import { PrismaClient } from '@prisma/client';

const databases = [
  { name: 'BudolShap', url: "postgresql://neondb_owner:npg_XLkrx73JNlRP@ep-wandering-breeze-aoin4z9c-pooler.c-2.ap-southeast-1.aws.neon.tech/budolshap?sslmode=require&channel_binding=require" },
  { name: 'BudolID', url: "postgresql://neondb_owner:npg_XLkrx73JNlRP@ep-wandering-breeze-aoin4z9c-pooler.c-2.ap-southeast-1.aws.neon.tech/budolid?sslmode=require&channel_binding=require" },
  { name: 'BudolPay', url: "postgresql://neondb_owner:npg_XLkrx73JNlRP@ep-wandering-breeze-aoin4z9c-pooler.c-2.ap-southeast-1.aws.neon.tech/budolpay?sslmode=require&channel_binding=require" },
  { name: 'BudolAccounting', url: "postgresql://neondb_owner:npg_XLkrx73JNlRP@ep-wandering-breeze-aoin4z9c-pooler.c-2.ap-southeast-1.aws.neon.tech/budolaccounting?sslmode=require&channel_binding=require" },
  { name: 'BudolLoan', url: "postgresql://neondb_owner:npg_XLkrx73JNlRP@ep-wandering-breeze-aoin4z9c-pooler.c-2.ap-southeast-1.aws.neon.tech/budolloan?sslmode=require&channel_binding=require" },
];

async function checkAll() {
  for (const db of databases) {
    console.log('\n' + '='.repeat(50));
    console.log(`=== Checking ${db.name} ===`);
    console.log('='.repeat(50));
    
    const prisma = new PrismaClient({
      datasources: { db: { url: db.url } }
    });
    
    try {
      // Test connection
      const version = await prisma.$queryRaw`SELECT version()`;
      console.log(`✅ Connected to PostgreSQL`);
      
      // List all tables
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `;
      
      console.log(`\n📊 Found ${tables.length} tables:`);
      if (tables.length > 0) {
        tables.forEach((t, i) => console.log(`  ${i + 1}. ${t.table_name}`));
      } else {
        console.log('  ⚠️ No tables found - schema not migrated yet');
      }
      
    } catch (error) {
      console.error(`❌ Error:`, error.message);
    } finally {
      await prisma.$disconnect();
    }
  }
}

checkAll();
