/**
 * Check users in database
 */

import pg from 'pg';
const { Pool } = pg;

// Vercel production database (via DATABASE_URL from env)
const vercelPool = new Pool({
  connectionString: 'postgres://c0999becfdd24a3fdf0c431059e54af5b7f61cedbdd336a0c0b9ead004aa22bc:sk_m8mN6a7H1RaICj0gOw19i@db.prisma.io:5432/postgres?sslmode=require'
});

async function checkUsers() {
  console.log('🔍 Checking users in Vercel database...\n');
  
  try {
    // Get all users
    const users = await vercelPool.query(`
      SELECT id, name, email, "emailVerified", "isAdmin", "createdAt"
      FROM "User"
      ORDER BY "createdAt" DESC
      LIMIT 10
    `);
    
    console.log('Users found:', users.rows.length);
    console.log('');
    
    for (const user of users.rows) {
      console.log('📧', user.email);
      console.log('   ID:', user.id);
      console.log('   Name:', user.name);
      console.log('   Verified:', user.emailVerified);
      console.log('   Admin:', user.isAdmin);
      console.log('   Created:', user.createdAt);
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await vercelPool.end();
  }
}

checkUsers();