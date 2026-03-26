// init-vercel-schema.js
import fs from 'fs';
import pkg from 'pg';
const { Client } = pkg;

const VERCEL_DB_URL = "postgres://c0999becfdd24a3fdf0c431059e54af5b7f61cedbdd336a0c0b9ead004aa22bc:sk_m8mN6a7H1RaICj0gOw19i@db.prisma.io:5432/postgres?sslmode=require";

async function main() {
  const c = new Client({ connectionString: VERCEL_DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  console.log('[INIT] Connected to Vercel Database.');

  const files = ['create_public.sql', 'create_budolid.sql', 'create_budolpay.sql'];

  for (const file of files) {
    console.log(`\n[INIT] Processing ${file}...`);
    const sqlText = fs.readFileSync(file, 'utf8');
    
    // Split by statement (semicolon at the end of a line or statement)
    // Basic split filtering out empty lines
    const statements = sqlText.split(';').map(s => s.trim()).filter(s => s.length > 0);

    for (let statement of statements) {
      // Fix: Some CREATE SCHEMA don't have IF NOT EXISTS in Prisma Output
      statement = statement.replace(/CREATE SCHEMA "(.*?)"/g, 'CREATE SCHEMA IF NOT EXISTS "$1"');

      try {
        await c.query(statement + ';');
        console.log(`  -> SUCCESS: ${statement.substring(0, 50).replace(/\n/g, ' ')}...`);
      } catch (err) {
        if (!err.message.includes('already exists')) {
           console.warn(`  -> FAILED: ${err.message} \n     Statement: ${statement.substring(0, 100)}...`);
        } else {
           console.log(`  -> SKIPPED (Already exists): ${statement.substring(0, 50).replace(/\n/g, ' ')}...`);
        }
      }
    }
  }

  console.log('\n[INIT] Done.');
  await c.end();
}

main().catch(console.error);
