import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_XLkrx73JNlRP@ep-wandering-breeze-aoin4z9c-pooler.c-2.ap-southeast-1.aws.neon.tech/budolid?sslmode=require&channel_binding=require"
    }
  }
});

async function main() {
  console.log('=== Checking BudolID Production Database ===\n');
  
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
      EcosystemApp: await prisma.ecosystemApp.count(),
      Session: await prisma.session.count()
    };
    console.log('   ✅ Counts:');
    Object.entries(counts).forEach(([k, v]) => console.log(`      ${k}: ${v}`));
    console.log('');
    
    // Check EcosystemApps
    console.log('4. Checking EcosystemApps...');
    const apps = await prisma.ecosystemApp.findMany();
    console.log(`   ✅ Found ${apps.length} apps:`);
    apps.forEach(app => console.log(`      - ${app.name} (${app.id})`));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
