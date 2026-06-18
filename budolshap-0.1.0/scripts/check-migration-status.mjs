/**
 * Check migration status
 */

import pg from 'pg';
const { Pool } = pg;

const vercelPool = new Pool({
  connectionString: 'postgres://c0999becfdd24a3fdf0c431059e54af5b7f61cedbdd336a0c0b9ead004aa22bc:sk_m8mN6a7H1RaICj0gOw19i@db.prisma.io:5432/postgres?sslmode=require'
});

const localPool = new Pool({
  connectionString: 'postgresql://postgres:r00t@localhost:5432/budolshap_1db?schema=public'
});

async function checkStatus() {
  console.log('📊 Migration Status\n');
  console.log('Table           | Vercel | Local | Status');
  console.log('---------------|-------|-------|--------');
  
  const TABLES = [
    'Category',
    'User',
    'Store',
    'StoreAddress', 
    'Address',
    'Product',
    'Cart',
    'CartItem',
    'Order',
    'OrderItem',
    'Wallet',
    'Transaction',
    'AuditLog',
    'RateLimit',
    'SystemSettings'
  ];
  
  for (const table of TABLES) {
    try {
      const vercel = await vercelPool.query('SELECT COUNT(*) FROM "' + table + '"');
      const local = await localPool.query('SELECT COUNT(*) FROM "' + table + '"');
      const v = parseInt(vercel.rows[0].count);
      const l = parseInt(local.rows[0].count);
      const status = l >= v ? '✅' : l > 0 ? '⚠️ ' : '❌';
      console.log(table.padEnd(15) + ' | ' + String(v).padStart(5) + ' | ' + String(l).padStart(5) + ' | ' + status);
    } catch (e) {
      console.log(table.padEnd(15) + ' |  ERR  |  ERR  | ' + e.message.slice(0, 20));
    }
  }
  
  await vercelPool.end();
  await localPool.end();
}

checkStatus();