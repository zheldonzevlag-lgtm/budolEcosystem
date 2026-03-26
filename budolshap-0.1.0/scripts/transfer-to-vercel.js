// transfer-to-vercel.js
// Reads data from local PostgreSQL and writes to Vercel Prisma Postgres.
// Connects to BOTH databases simultaneously and transfers table by table.
import pkg from 'pg';
const { Client } = pkg;

const LOCAL_DB_URL = "postgresql://postgres:r00t@localhost:5432/budolshap_1db";

const VERCEL_DB_URL =
  "postgres://c0999becfdd24a3fdf0c431059e54af5b7f61cedbdd336a0c0b9ead004aa22bc:sk_m8mN6a7H1RaICj0gOw19i@db.prisma.io:5432/postgres?sslmode=require";

// Tables to transfer with their schemas
// Ordered to handle foreign key dependencies (parents first)
const TABLES = [
  // public schema - independent tables first
  { schema: 'public', table: 'User' },
  { schema: 'public', table: 'Category' },
  { schema: 'public', table: 'Store' },
  { schema: 'public', table: 'StoreAddress' },
  { schema: 'public', table: 'Product' },
  { schema: 'public', table: 'Address' },
  { schema: 'public', table: 'Cart' },
  { schema: 'public', table: 'CartItem' },
  { schema: 'public', table: 'Order' },
  { schema: 'public', table: 'OrderItem' },
  { schema: 'public', table: 'Transaction' },
  { schema: 'public', table: 'Coupon' },
  { schema: 'public', table: 'Rating' },
  { schema: 'public', table: 'Return' },
  { schema: 'public', table: 'PaymentProof' },
  { schema: 'public', table: 'PayoutRequest' },
  { schema: 'public', table: 'Wallet' },
  { schema: 'public', table: 'Chat' },
  { schema: 'public', table: 'Message' },
  { schema: 'public', table: 'SystemSettings' },
  { schema: 'public', table: 'Checkout' },
  { schema: 'public', table: 'AuditLog' },
  { schema: 'public', table: 'WebhookEvent' },
  { schema: 'public', table: 'VerificationCode' },
  { schema: 'public', table: 'RateLimit' },
  // budolid schema
  { schema: 'budolid', table: 'User' },
  { schema: 'budolid', table: 'EcosystemApp' },
  { schema: 'budolid', table: 'Session' },
  // budolpay schema
  { schema: 'budolpay', table: 'User' },
  { schema: 'budolpay', table: 'Wallet' },
  { schema: 'budolpay', table: 'Transaction' },
  { schema: 'budolpay', table: 'AuditLog' },
  { schema: 'budolpay', table: 'ChartOfAccount' },
  { schema: 'budolpay', table: 'LedgerEntry' },
  { schema: 'budolpay', table: 'Dispute' },
  { schema: 'budolpay', table: 'EcosystemApp' },
  { schema: 'budolpay', table: 'FavoriteRecipient' },
  { schema: 'budolpay', table: 'RateLimit' },
  { schema: 'budolpay', table: 'Session' },
  { schema: 'budolpay', table: 'Settlement' },
  { schema: 'budolpay', table: 'SystemSetting' },
  { schema: 'budolpay', table: 'VerificationDocument' },
  { schema: 'budolpay', table: 'ChangeRequest' },
];

const BATCH_SIZE = 50;

async function transferTable(localClient, vercelClient, schema, table) {
  const fullName = `${schema}."${table}"`;
  try {
    // Get column info
    const colRes = await localClient.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = $1 AND table_name = $2 
      ORDER BY ordinal_position
    `, [schema, table]);

    if (colRes.rows.length === 0) {
      console.log(`  [SKIP] ${fullName} - no columns found`);
      return { inserted: 0, errors: 0 };
    }

    const columns = colRes.rows.map(r => r.column_name);
    const quotedCols = columns.map(c => `"${c}"`).join(', ');

    // Get total count from local
    const countRes = await localClient.query(`SELECT COUNT(*) FROM ${fullName}`);
    const total = parseInt(countRes.rows[0].count);

    if (total === 0) {
      console.log(`  [SKIP] ${fullName} - empty (0 rows)`);
      return { inserted: 0, errors: 0 };
    }

    console.log(`  [COPY] ${fullName} (${total} rows)...`);

    // Disable triggers on Vercel target and clear existing data
    await vercelClient.query(`DELETE FROM ${fullName}`).catch(() => {});

    let inserted = 0;
    let errors = 0;
    let offset = 0;

    while (offset < total) {
      const rows = await localClient.query(
        `SELECT ${quotedCols} FROM ${fullName} ORDER BY 1 LIMIT $1 OFFSET $2`,
        [BATCH_SIZE, offset]
      );

      for (const row of rows.rows) {
        const values = columns.map(col => row[col]);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        const sql = `INSERT INTO ${fullName} (${quotedCols}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
        try {
          await vercelClient.query(sql, values);
          inserted++;
        } catch (err) {
          errors++;
          if (errors <= 2) console.warn(`    [ERR] ${err.message.slice(0, 120)}`);
        }
      }
      offset += BATCH_SIZE;
      if (offset % 500 === 0) process.stdout.write(`    ...${offset}/${total}\n`);
    }

    console.log(`    -> ${inserted} inserted, ${errors} errors`);
    return { inserted, errors };
  } catch (err) {
    console.warn(`  [FAIL] ${fullName}: ${err.message.slice(0, 120)}`);
    return { inserted: 0, errors: 1 };
  }
}

async function main() {
  console.log('[TRANSFER] Connecting to local PostgreSQL...');
  const local = new Client({ connectionString: LOCAL_DB_URL });
  await local.connect();
  console.log('[TRANSFER] Connected to local DB.');

  console.log('[TRANSFER] Connecting to Vercel Postgres...');
  const vercel = new Client({
    connectionString: VERCEL_DB_URL,
    ssl: { rejectUnauthorized: false },
    statement_timeout: 120000,
    connectionTimeoutMillis: 30000,
  });
  await vercel.connect();
  console.log('[TRANSFER] Connected to Vercel DB.');

  // Disable FK checks on Vercel temp (set session_replication_role)
  await vercel.query("SET session_replication_role = 'replica';").catch(e =>
    console.warn('[TRANSFER] Could not disable FK checks:', e.message.slice(0, 80))
  );

  let totalInserted = 0;
  let totalErrors = 0;

  for (const { schema, table } of TABLES) {
    const result = await transferTable(local, vercel, schema, table);
    totalInserted += result.inserted;
    totalErrors += result.errors;
  }

  // Re-enable FK checks
  await vercel.query("SET session_replication_role = 'origin';").catch(() => {});

  console.log('\n[TRANSFER] ===== SUMMARY =====');
  console.log(`Total rows inserted: ${totalInserted}`);
  console.log(`Total errors: ${totalErrors}`);

  // Final verification
  const productCount = await vercel.query('SELECT COUNT(*) FROM public."Product"').catch(e => ({
    rows: [{ count: `error: ${e.message.slice(0, 80)}` }]
  }));
  console.log(`Products on Vercel: ${productCount.rows[0].count}`);

  const userCount = await vercel.query('SELECT COUNT(*) FROM budolid."User"').catch(e => ({
    rows: [{ count: `error: ${e.message.slice(0, 80)}` }]
  }));
  console.log(`Users (budolid) on Vercel: ${userCount.rows[0].count}`);

  await local.end();
  await vercel.end();
  console.log('[TRANSFER] Done!');
}

main().catch(err => {
  console.error('[TRANSFER] FATAL:', err);
  process.exit(1);
});
