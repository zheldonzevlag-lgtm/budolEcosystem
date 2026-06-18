/**
 * Check Vercel database tables and data
 */

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://c0999becfdd24a3fdf0c431059e54af5b7f61cedbdd336a0c0b9ead004aa22bc:sk_m8mN6a7H1RaICj0gOw19i@db.prisma.io:5432/postgres?sslmode=require'
});

async function check() {
  console.log('🔗 Checking Vercel database...\n');
  
  // Get all tables
  const tables = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `);
  
  console.log('Tables in Vercel DB:');
  tables.rows.forEach(t => console.log('  - ' + t.table_name));
  
  // Get row counts for main tables
  const mainTables = ['User', 'Store', 'Product', 'Order', 'Category', 'Cart', 'Address', 'AuditLog'];
  console.log('\nRow counts:');
  
  for (const table of mainTables) {
    try {
      const result = await pool.query(`SELECT COUNT(*) as count FROM "${table}"`);
      console.log(`  - ${table}: ${result.rows[0].count}`);
    } catch (e) {
      console.log(`  - ${table}: ERROR - ${e.message}`);
    }
  }
  
  await pool.end();
  console.log('\n✅ Database check complete');
}

check().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});