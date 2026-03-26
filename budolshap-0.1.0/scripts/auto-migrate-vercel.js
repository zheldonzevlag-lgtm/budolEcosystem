// auto-migrate-vercel.js
import pkg from 'pg';
const { Client } = pkg;

const LOCAL_DB_URL = "postgresql://postgres:r00t@localhost:5432/budolshap_1db";
const VERCEL_DB_URL = "postgres://c0999becfdd24a3fdf0c431059e54af5b7f61cedbdd336a0c0b9ead004aa22bc:sk_m8mN6a7H1RaICj0gOw19i@db.prisma.io:5432/postgres?sslmode=require";

async function main() {
  const local = new Client({ connectionString: LOCAL_DB_URL });
  const vercel = new Client({ connectionString: VERCEL_DB_URL, ssl: { rejectUnauthorized: false } });
  
  await local.connect();
  await vercel.connect();
  
  console.log('[MIGRATE] Connected to both databases. Preparing schemas...');
  
  // Ensure schemas exist
  for (const s of ['public', 'budolid', 'budolpay', 'budolaccounting']) {
    try {
        await vercel.query(`CREATE SCHEMA IF NOT EXISTS ${s};`);
        console.log(`[MIGRATE] Ensured schema exists: ${s}`);
    } catch(e) {
        console.warn(`[MIGRATE] Failed to create schema ${s}: ${e.message}`);
    }
  }

  // Define common enums used across the schemas
  const enums = [
      { schema: 'public', name: 'Role', values: ['USER', 'MERCHANT', 'ADMIN'] },
      { schema: 'public', name: 'OrderStatus', values: ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'] },
      { schema: 'public', name: 'CheckoutStatus', values: ['PENDING', 'COMPLETED', 'FAILED'] },
      { schema: 'budolpay', name: 'UserRole', values: ['USER', 'AGENT', 'ADMIN'] },
      { schema: 'budolpay', name: 'KYCStatus', values: ['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'] },
      { schema: 'budolpay', name: 'TransactionType', values: ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'PAYMENT', 'REFUND', 'FEE'] },
      { schema: 'budolpay', name: 'TransactionStatus', values: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'] }
  ];

  for(const e of enums) {
      try {
          const valList = e.values.map(v => `'${v}'`).join(', ');
          await vercel.query(`CREATE TYPE ${e.schema}."${e.name}" AS ENUM (${valList});`);
          console.log(`[MIGRATE] Created ENUM: ${e.schema}."${e.name}"`);
      } catch(err) {
          if (!err.message.includes('already exists')) {
              console.warn(`[MIGRATE] Failed to create ENUM ${e.name}: ${err.message}`);
          }
      }
  }

  console.log('[MIGRATE] Comparing schemas...');
  
  const tables = [
    // public
    { schema: 'public', table: 'User' },
    { schema: 'public', table: 'Product' },
    { schema: 'public', table: 'Order' },
    { schema: 'public', table: 'OrderItem' },
    { schema: 'public', table: 'CartItem' },
    { schema: 'public', table: 'Store' },
    { schema: 'public', table: 'StoreAddress' },
    { schema: 'public', table: 'Checkout' },
    { schema: 'public', table: 'Address' },
    { schema: 'public', table: 'SystemSettings' },
    // budolid
    { schema: 'budolid', table: 'User' },
    { schema: 'budolid', table: 'EcosystemApp' },
    { schema: 'budolid', table: 'Session' },
    // budolpay
    { schema: 'budolpay', table: 'User' },
    { schema: 'budolpay', table: 'Wallet' },
    { schema: 'budolpay', table: 'Transaction' },
    { schema: 'budolpay', table: 'AuditLog' },
    { schema: 'budolpay', table: 'RateLimit' },
    { schema: 'budolpay', table: 'SystemSetting' },
    { schema: 'budolpay', table: 'ChangeRequest' }
  ];
  
  let alters = 0;

  for (const { schema, table } of tables) {
    // Get local columns
    const localRes = await local.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_schema = $1 AND table_name = $2
    `, [schema, table]);
    
    // Get Vercel columns
    const vercelRes = await vercel.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = $1 AND table_name = $2
    `, [schema, table]);
    
    const localCols = localRes.rows;
    const vercelCols = new Set(vercelRes.rows.map(r => r.column_name));
    
    for (const col of localCols) {
      if (!vercelCols.has(col.column_name)) {
        console.log(`[MIGRATE] Missing column: ${schema}."${table}"."${col.column_name}"`);
        
        let type = col.data_type;
        if (type === 'character varying') type = 'VARCHAR';
        if (type === 'timestamp without time zone') type = 'TIMESTAMP';
        if (type === 'timestamp with time zone') type = 'TIMESTAMPTZ';
        // Handle custom enums by casting to TEXT for simplicity if needed, but Prisma uses TEXT for strings mostly, or enums.
        // If it's a USER-DEFINED type (enum), we might need to handle it.
        if (type === 'USER-DEFINED') {
          // Fallback to text if we can't easily create the enum
          const enumRes = await local.query(`SELECT udt_name FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`, [table, col.column_name]);
          const enumName = enumRes.rows[0].udt_name;
          type = `"${schema}"."${enumName}"`;
        }

        let sql = `ALTER TABLE ${schema}."${table}" ADD COLUMN "${col.column_name}" ${type}`;
        if (col.column_default) {
            // Simplify default if needed, or omit it if it's complex
            // sql += ` DEFAULT ${col.column_default}`; 
        }

        console.log(`  -> ${sql}`);
        try {
          await vercel.query(sql);
          alters++;
          console.log(`  -> SUCCESS`);
        } catch (err) {
          console.warn(`  -> FAILED: ${err.message}`);
          // If enum type doesn't exist, fallback to TEXT
          if (err.message.includes('does not exist') && type.includes('USER-DEFINED')) {
             try {
                await vercel.query(`ALTER TABLE ${schema}."${table}" ADD COLUMN "${col.column_name}" TEXT`);
                console.log(`  -> SUCCESS (Fallback to TEXT)`);
                alters++;
             } catch(e2) {}
          }
        }
      }
    }
  }
  
  console.log(`\n[MIGRATE] Done. Applied ${alters} ALTER statements.`);
  
  await local.end();
  await vercel.end();
}

main().catch(console.error);
