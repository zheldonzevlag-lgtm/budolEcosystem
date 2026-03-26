/**
 * Schema migration fix: Rename payment-gateway Transaction table
 * The shared Vercel Postgres DB has a budolshap Transaction table conflict.
 * Solution: Create a separate PgTransaction table for the payment-gateway-service.
 */
const { PrismaClient } = require('@prisma/client');

async function migrate() {
  const url = "postgres://c0999becfdd24a3fdf0c431059e54af5b7f61cedbdd336a0c0b9ead004aa22bc:sk_m8mN6a7H1RaICj0gOw19i@db.prisma.io:5432/postgres?sslmode=require";
  const prisma = new PrismaClient({ datasources: { db: { url } } });

  try {
    console.log("=== Creating PgTransaction table for payment-gateway-service ===\n");

    // Check if PgTransaction already exists
    const existing = await prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema='public' AND table_name='PgTransaction'
    `;
    
    if (existing.length > 0) {
      console.log("✅ PgTransaction table already exists");
      return;
    }

    // Create enum types if they don't already exist
    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "PgTransactionType" AS ENUM ('CASH_IN', 'CASH_OUT', 'P2P_TRANSFER', 'MERCHANT_PAYMENT', 'FEE', 'REFUND');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `;

    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "PgTransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `;

    // Create the PgTransaction table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "PgTransaction" (
        id TEXT NOT NULL PRIMARY KEY,
        amount DECIMAL(18,2) NOT NULL,
        type "PgTransactionType" NOT NULL,
        status "PgTransactionStatus" NOT NULL DEFAULT 'PENDING',
        description TEXT,
        "senderId" TEXT,
        "receiverId" TEXT,
        "storeId" TEXT,
        "storeName" TEXT,
        "referenceId" TEXT NOT NULL UNIQUE,
        metadata TEXT,
        fee DECIMAL(18,2) NOT NULL DEFAULT 0.0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "completedAt" TIMESTAMP,
        "settlementId" TEXT
      )
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "PgTransaction_referenceId_idx" ON "PgTransaction"("referenceId");
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "PgTransaction_storeId_idx" ON "PgTransaction"("storeId");
    `;

    console.log("✅ PgTransaction table created successfully");

    // Verify
    const check = await prisma.$queryRaw`
      SELECT column_name FROM information_schema.columns
      WHERE table_name='PgTransaction' AND table_schema='public'
      ORDER BY ordinal_position
    `;
    console.log("Columns:", check.map(r => r.column_name).join(', '));

  } catch(e) {
    console.error("❌ Migration failed:", e.message);
    if (e.code) console.error("Code:", e.code);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
