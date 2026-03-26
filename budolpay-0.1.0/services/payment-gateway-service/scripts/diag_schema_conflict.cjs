/**
 * Schema conflict diagnostic
 * Both budolshap and payment-gateway-service use the same Postgres instance
 * but have DIFFERENT Transaction models. This checks which tables exist and
 * if the transaction insert is conflicting.
 */
const { PrismaClient } = require('@prisma/client');

async function diagnoseSchemaConflict() {
  const url = "postgres://c0999becfdd24a3fdf0c431059e54af5b7f61cedbdd336a0c0b9ead004aa22bc:sk_m8mN6a7H1RaICj0gOw19i@db.prisma.io:5432/postgres?sslmode=require";
  const prisma = new PrismaClient({
    datasources: { db: { url } },
    log: ['error', 'warn', 'query']
  });

  try {
    console.log("=== Schema Conflict Diagnostic ===\n");

    // Check all tables in DB
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    console.log("Tables in DB:", tables.map(t => t.table_name).join(', '));
    console.log("");

    // Check budolpay Transaction table columns
    const txnCols = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'Transaction' AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    console.log("Transaction table columns:");
    txnCols.forEach(c => console.log(`  - ${c.column_name}: ${c.data_type} (nullable: ${c.is_nullable})`));
    console.log("");

    // Try to directly insert a transaction
    console.log("Attempting direct transaction insert...");
    const result = await prisma.$queryRaw`
      INSERT INTO "Transaction" (id, amount, type, status, description, "referenceId", metadata, fee, "createdAt")
      VALUES (
        gen_random_uuid()::text,
        100.0,
        'MERCHANT_PAYMENT',
        'PENDING',
        'diagnostic test',
        'DIAG-' || to_char(now(), 'YYYYMMDDHHMMSS') || '-TEST',
        '{"test": true}'::text,
        0.0,
        now()
      )
      RETURNING id, "referenceId"
    `;
    console.log("✅ Direct insert succeeded:", result);
    
    // Cleanup test record
    if (result && result[0]) {
      await prisma.$queryRaw`DELETE FROM "Transaction" WHERE id = ${result[0].id}`;
      console.log("✅ Test record cleaned up");
    }

  } catch (error) {
    console.error("❌ Diagnostic failed:", error.message);
    console.error("Code:", error.code);
    console.error("Meta:", JSON.stringify(error.meta, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseSchemaConflict();
