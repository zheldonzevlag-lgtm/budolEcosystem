/**
 * Check Vercel database schema
 */

import pg from 'pg';
const { Pool } = pg;

const vercelPool = new Pool({
  connectionString: 'postgres://c0999becfdd24a3fdf0c431059e54af5b7f61cedbdd336a0c0b9ead004aa22bc:sk_m8mN6a7H1RaICj0gOw19i@db.prisma.io:5432/postgres?sslmode=require'
});

async function checkSchema() {
  console.log('Checking Vercel Category schema...');
  
  const result = await vercelPool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'Category' 
    ORDER BY ordinal_position
  `);
  
  console.log('Vercel Category columns:');
  result.rows.forEach(c => console.log('  ' + c.column_name));
  
  await vercelPool.end();
}

checkSchema();