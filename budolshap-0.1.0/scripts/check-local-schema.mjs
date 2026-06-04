/**
 * Check local database schema
 */

import pg from 'pg';
const { Pool } = pg;

const localPool = new Pool({
  connectionString: 'postgresql://postgres:r00t@localhost:5432/budolshap_1db?schema=public'
});

async function checkSchema() {
  console.log('Checking local Category schema...');
  
  const result = await localPool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'Category' 
    ORDER BY ordinal_position
  `);
  
  console.log('Local Category columns:');
  result.rows.forEach(c => console.log('  ' + c.column_name));
  
  await localPool.end();
}

checkSchema();