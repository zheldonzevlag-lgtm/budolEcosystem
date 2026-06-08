// WHY: Create the budolid schema on the working Neon endpoint (ep-wandering-breeze)
// and run Prisma migrations to set up the tables
require('dotenv').config();
const { execSync } = require('child_process');

// The working Neon endpoint URL, targeting budolid schema
const DATABASE_URL = process.env.DATABASE_URL + '&schema=budolid';
// Direct URL (non-pooled) needed for migrations
const DIRECT_URL = DATABASE_URL.replace('-pooler.', '.');

console.log('=== Setting up budolid schema on working Neon endpoint ===');
console.log('DATABASE_URL:', DATABASE_URL.replace(/:[^:@]+@/, ':****@'));
console.log('DIRECT_URL:', DIRECT_URL.replace(/:[^:@]+@/, ':****@'));

// First create the schema
const { Client } = require('pg');
async function main() {
    const client = new Client({ connectionString: DATABASE_URL });
    try {
        await client.connect();
        console.log('\n1. Connected to database');
        
        // Create the budolid schema if it doesn't exist
        await client.query('CREATE SCHEMA IF NOT EXISTS budolid');
        console.log('2. ✅ Schema "budolid" created (or already exists)');
        
        // Verify
        const result = await client.query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'budolid'`);
        console.log('3. Schema exists:', result.rows.length > 0);
        
        await client.end();
        
        // Now run Prisma migration with the new URL
        console.log('\n4. Running Prisma db push...');
        execSync(`npx prisma db push --accept-data-loss`, {
            env: {
                ...process.env,
                DATABASE_URL,
                DIRECT_URL
            },
            stdio: 'inherit'
        });
        
        console.log('\n✅ All done! budolid schema is ready on the working Neon endpoint.');
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
}

main();
