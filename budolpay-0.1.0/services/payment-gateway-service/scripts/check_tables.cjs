/**
 * Check exact table names in DB (case sensitive)
 */
const { PrismaClient } = require('@prisma/client');

async function checkTables() {
  const url = "postgres://c0999becfdd24a3fdf0c431059e54af5b7f61cedbdd336a0c0b9ead004aa22bc:sk_m8mN6a7H1RaICj0gOw19i@db.prisma.io:5432/postgres?sslmode=require";
  const prisma = new PrismaClient({ datasources: { db: { url } } });

  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema='public' 
      ORDER BY table_name
    `;
    console.log("All tables:", tables.map(t => t.table_name));
  } catch(e) {
    console.error("Error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
