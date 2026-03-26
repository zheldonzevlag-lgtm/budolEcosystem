/**
 * Full Transaction table schema inspector
 * Shows all columns in the Transaction table to understand which schema is in place
 */
const { PrismaClient } = require('@prisma/client');

async function inspectColumns() {
  const url = "postgres://c0999becfdd24a3fdf0c431059e54af5b7f61cedbdd336a0c0b9ead004aa22bc:sk_m8mN6a7H1RaICj0gOw19i@db.prisma.io:5432/postgres?sslmode=require";
  const prisma = new PrismaClient({ datasources: { db: { url } } });

  try {
    // Get all columns in the Transaction table
    const cols = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Transaction'
      ORDER BY ordinal_position
    `;
    console.log("=== Transaction Table Columns (Current DB) ===");
    if (cols.length === 0) {
      console.log("(no rows — table may be named differently)");
      // Try lowercase
      const cols2 = await prisma.$queryRaw`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema='public' AND table_name ILIKE '%transaction%'
      `;
      console.log("Tables matching 'transaction':", cols2.map(r=>r.table_name));
    } else {
      cols.forEach(c => {
        console.log(`  ${c.column_name.padEnd(25)} ${c.data_type.padEnd(20)} nullable:${c.is_nullable}`);
      });
    }
  } catch(e) {
    console.error("Error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

inspectColumns();
