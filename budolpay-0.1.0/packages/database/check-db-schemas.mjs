import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_XLkrx73JNlRP@ep-wandering-breeze-aoin4z9c-pooler.c-2.ap-southeast-1.aws.neon.tech/budolpay?sslmode=require"
    }
  }
});

async function checkDB() {
    console.log('=== Checking BudolPay Database ===');

    // Check schemas
    const schemas = await prisma.$queryRaw`SELECT schema_name FROM information_schema.schemata ORDER BY schema_name;`;
    console.log('\nSchemas found:', schemas.map(s => s.schema_name));

    // Check tables in public schema
    const publicTables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`;
    console.log('\nPublic tables:', publicTables.map(t => t.table_name));
    
    // Check tables in budolpay schema (if exists)
    try {
        const budolpayTables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'budolpay' ORDER BY table_name;`;
        console.log('\nBudolpay schema tables:', budolpayTables.map(t => t.table_name));
    } catch(e) {
        console.log('\nBudolpay schema doesn\'t exist yet');
    }

    await prisma.$disconnect();
}

checkDB();
