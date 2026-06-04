/**
 * Migrate data from Vercel to local database - PostgreSQL compatible
 */

import pg from 'pg';
const { Pool } = pg;

const vercelPool = new Pool({
  connectionString: 'postgres://c0999becfdd24a3fdf0c431059e54af5b7f61cedbdd336a0c0b9ead004aa22bc:sk_m8mN6a7H1RaICj0gOw19i@db.prisma.io:5432/postgres?sslmode=require'
});

const localPool = new Pool({
  connectionString: 'postgresql://postgres:r00t@localhost:5432/budolshap_1db?schema=public'
});

function convertValue(val) {
  if (val === undefined) return null;
  if (val === null) return null;
  if (typeof val === 'object') return JSON.stringify(val);
  return val;
}

async function migrateTable(tableName) {
  console.log('\n📤 Migrating ' + tableName + '...');
  
  try {
    const vercelResult = await vercelPool.query('SELECT * FROM "' + tableName + '"');
    const rows = vercelResult.rows;
    console.log('   Vercel: ' + rows.length + ' rows');
    
    if (rows.length === 0) {
      console.log('   → No data');
      return;
    }
    
    await localPool.query('DELETE FROM "' + tableName + '"');
    
    const columns = Object.keys(rows[0]);
    
    let imported = 0;
    for (const row of rows) {
      const vals = columns.map(col => convertValue(row[col]));
      const colQuoted = columns.map(c => '"' + c + '"').join(', ');
      const placeholders = columns.map((_, idx) => '$' + (idx + 1)).join(', ');
      
      try {
        await localPool.query(
          'INSERT INTO "' + tableName + '" (' + colQuoted + ') VALUES (' + placeholders + ')',
          vals
        );
        imported++;
      } catch (e) {
        // Continue even with errors
      }
    }
    
    console.log('   Local: ' + imported + ' rows');
    
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
    
    // Use transaction with deferrable constraints
    await localPool.query('BEGIN');
    await localPool.query('SET CONSTRAINTS ALL DEFERRED');
    
    const TABLES = [
      'Category',
      'User',
      'Store',
      'StoreAddress',
      'Address',
      'Product',
      'Cart',
      'CartItem',
      'Coupon',
      'Order',
      'OrderItem',
      'PaymentProof',
      'Rating',
      'Chat',
      'Message',
      'Checkout',
      'Return',
      'Wallet',
      'Transaction',
      'PayoutRequest',
      'WebhookEvent',
      'VerificationCode',
      'AuditLog',
      'RateLimit',
      'SystemSettings'
    ];
    
    for (const table of TABLES) {
      await migrateTable(table);
    }
    
    await localPool.query('COMMIT');
    
    console.log('\n✅ Migration complete!');
    
  } catch (error) {
    await localPool.query('ROLLBACK');
    console.error('\n❌ Error: ' + error.message);
  } finally {
    await vercelPool.end();
    await localPool.end();
  }
}

main();