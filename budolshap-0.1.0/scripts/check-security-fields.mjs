/**
 * Check security fields in local database
 */

import pg from 'pg';
const { Pool } = pg;

const localPool = new Pool({
  connectionString: 'postgresql://postgres:r00t@localhost:5432/budolshap_1db?schema=public'
});

async function checkFields() {
  console.log('Checking User table for security fields...\n');
  
  const result = await localPool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'User' 
    AND column_name IN ('failedAttempts', 'lockedUntil')
  `);
  
  console.log('Security fields found:');
  if (result.rows.length === 0) {
    console.log('  ❌ None found - need to add them');
  } else {
    result.rows.forEach(c => console.log('  ✅ ' + c.column_name));
  }
  
  // Check Session table
  const sessionResult = await localPool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_name = 'Session'
  `);
  
  console.log('\nSession table:');
  if (sessionResult.rows.length === 0) {
    console.log('  ❌ Not found - need to create it');
  } else {
    console.log('  ✅ Session table exists');
  }
  
  await localPool.end();
}

checkFields();