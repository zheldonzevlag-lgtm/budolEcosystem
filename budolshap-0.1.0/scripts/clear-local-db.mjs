/**
 * Clear local database before migration
 */

import pg from 'pg';
const { Pool } = pg;

// Local database
const localPool = new Pool({
  connectionString: 'postgresql://postgres:r00t@localhost:5432/budolshap_1db?schema=public'
});

// Tables to clear (in reverse order of dependencies)
const TABLES = [
  'AuditLog',
  'RateLimit',
  'VerificationCode',
  'WebhookEvent',
  'PayoutRequest',
  'Transaction',
  'Wallet',
  'Return',
  'Checkout',
  'Message',
  'Chat',
  'Rating',
  'PaymentProof',
  'OrderItem',
  'Order',
  'Coupon',
  'CartItem',
  'Cart',
  'Product',
  'Address',
  'StoreAddress',
  'Store',
  'User',
  'Category',
  'SystemSettings'
];

async function clearTable(tableName) {
  try {
    await localPool.query('DELETE FROM "' + tableName + '"');
    console.log('   Cleared: ' + tableName);
  } catch (error) {
    console.log('   Error clearing ' + tableName + ': ' + error.message);
  }
}

async function main() {
  console.log('🔗 Connecting to local database...');
  
  try {
    await localPool.query('SELECT 1');
    console.log('✅ Local DB connected\n');
    
    console.log('🗑️  Clearing all tables...');
    
    for (const table of TABLES) {
      await clearTable(table);
    }
    
    console.log('\n✅ Database cleared!');
    
  } catch (error) {
    console.error('\n❌ Error: ' + error.message);
  } finally {
    await localPool.end();
  }
}

main();