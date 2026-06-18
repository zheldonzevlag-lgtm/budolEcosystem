/**
 * Migrate data from Vercel to local database - debug version
 */

import pg from 'pg';
const { Pool } = pg;

// Vercel production database
const vercelPool = new Pool({
  connectionString: 'postgres://c0999becfdd24a3fdf0c431059e54af5b7f61cedbdd336a0c0b9ead004aa22bc:sk_m8mN6a7H1RaICj0gOw19i@db.prisma.io:5432/postgres?sslmode=require'
});

// Local database
const localPool = new Pool({
  connectionString: 'postgresql://postgres:r00t@localhost:5432/budolshap_1db?schema=public'
});

// Tables to migrate (in order of dependencies)
const TABLES = [
  'Category',
  'User',
  'Store',
  'StoreAddress',
  'Address',
  'Product'
];

function convertValue(val) {
  if (val === undefined) return null;
  if (val === null) return null;
  if (typeof val === 'object') return JSON.stringify(val);
  return val;
}

async function migrateTable(tableName) {
  console.log('\n📤 Migrating ' + tableName + '...');
  
  try {
    // Get data from Vercel
    const vercelResult = await vercelPool.query('SELECT * FROM "' + tableName + '"');
    const rows = vercelResult.rows;
    console.log('   Vercel: ' + rows.length + ' rows');
    
    if (rows.length === 0) {
      console.log('   → No data to migrate');
      return;
    }
    
    // Clear local table
    await localPool.query('DELETE FROM "' + tableName + '"');
    console.log('   Cleared local table');
    
    // Get column names from first row
    const columns = Object.keys(rows[0]);
    const columnList = columns.join(', ');
    
    // Insert first row as test
    const testRow = rows[0];
    const vals = columns.map(col => convertValue(testRow[col]));
    const placeholders = columns.map((_, idx) => '$' + (idx + 1)).join(', ');
    
    console.log('   Columns: ' + columnList);
    console.log('   First row: ' + JSON.stringify(vals.slice(0, 5)) + '...');
    
    try {
      const insertResult = await localPool.query(
        'INSERT INTO "' + tableName + '" (' + columnList + ') VALUES (' + placeholders + ')',
        vals
      );
      console.log('   ✅ First row inserted successfully');
    } catch (insertError) {
      console.log('   ❌ Insert error: ' + insertError.message);
      console.log('   SQL: ' + 'INSERT INTO "' + tableName + '" (' + columnList + ') VALUES (' + placeholders + ')');
    }
    
  } catch (error) {
    console.log('   ⚠️  Error: ' + error.message);
  }
}

async function main() {
  console.log('🔗 Connecting to databases...');
  
  try {
    await vercelPool.query('SELECT 1');
    console.log('✅ Vercel DB connected');
    
    await localPool.query('SELECT 1');
    console.log('✅ Local DB connected\n');
    
    for (const table of TABLES) {
      await migrateTable(table);
    }
    
    console.log('\n✅ Test migration complete!');
    
  } catch (error) {
    console.error('\n❌ Error: ' + error.message);
  } finally {
    await vercelPool.end();
    await localPool.end();
  }
}

main();