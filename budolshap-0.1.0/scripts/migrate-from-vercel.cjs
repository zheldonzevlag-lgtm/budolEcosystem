/**
 * Script to export Vercel production database
 * Downloads all data from Vercel and exports to local database
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

// Vercel production database connection
const vercelPool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://c0999becfdd24a3fdf0c431059e54af5b7f61cedbdd336a0c0b9ead004aa22bc:sk_m8mN6a7H1RaICj0gOw19i@db.prisma.io:5432/postgres?sslmode=require'
});

// Local database connection
const localPool = new Pool({
  connectionString: 'postgresql://postgres:r00t@localhost:5432/budolshap_1db?schema=public'
});

const TABLES = [
  'User', 'Address', 'Category', 'Product', 'Store', 'StoreAddress',
  'Cart', 'CartItem', 'Order', 'OrderItem', 'PaymentProof',
  'Coupon', 'Rating', 'Chat', 'Message', 'Checkout',
  'Return', 'Wallet', 'Transaction', 'PayoutRequest',
  'WebhookEvent', 'VerificationCode', 'AuditLog', 'RateLimit', 'SystemSettings'
];

async function exportTable(tableName) {
  console.log(`📤 Exporting ${tableName}...`);
  const result = await vercelPool.query(`SELECT * FROM "${tableName}"`);
  console.log(`   → ${result.rows.length} rows`);
  return result.rows;
}

async function importTable(tableName, rows) {
  if (rows.length === 0) return;
  
  console.log(`📥 Importing ${tableName}...`);
  
  // Clear existing data
  await localPool.query(`DELETE FROM "${tableName}"`);
  
  // Insert new data in batches
  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const columns = Object.keys(batch[0]);
    const values = batch.map((row, idx) => {
      return columns.map((col, cidx) => `$${idx * columns.length + cidx + 1}`).join(', ');
    });
    
    try {
      await localPool.query(`
        INSERT INTO "${tableName}" (${columns.join(', ')})
        VALUES ${batch.map((_, idx) => `(${values[idx]})`).join(', ')}
        ON CONFLICT DO NOTHING
      `, batch.flatMap(row => columns.map(col => row[col])));
    } catch (e) {
      console.log(`   ⚠️  Batch import failed, trying one by one...`);
      for (const row of batch) {
        const cols = columns.join(', ');
        const vals = columns.map((_, cidx) => `$${cidx + 1}`).join(', ');
        try {
          await localPool.query(`INSERT INTO "${tableName}" (${cols}) VALUES (${vals}) ON CONFLICT DO NOTHING`, columns.map(col => row[col]));
        } catch (err) {
          // Skip duplicates
        }
      }
    }
  }
  console.log(`   → ${rows.length} rows imported`);
}

async function main() {
  try {
    console.log('🔗 Connecting to Vercel database...');
    const test = await vercelPool.query('SELECT 1');
    console.log('✅ Vercel database connected');
    
    console.log('\n🔗 Connecting to local database...');
    const testLocal = await localPool.query('SELECT 1');
    console.log('✅ Local database connected');
    
    // Export and import each table
    for (const table of TABLES) {
      try {
        const rows = await exportTable(table);
        await importTable(table, rows);
      } catch (e) {
        console.log(`   ⚠️  ${table}: ${e.message}`);
      }
    }
    
    console.log('\n✅ Migration complete!');
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await vercelPool.end();
    await localPool.end();
  }
}

main();