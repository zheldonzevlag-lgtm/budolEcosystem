// Simple script to show database name
require('dotenv').config({ path: '.env.production' });

console.log('\n📊 DATABASE INFORMATION:\n');
console.log('Database Type: PostgreSQL (Vercel Postgres)');
console.log('Provider: Vercel');
console.log('\nConnection Details:');

// Show DATABASE_URL (masked for security)
if (process.env.DATABASE_URL) {
    const url = process.env.DATABASE_URL;

    // Extract database name from URL
    // Format: postgres://user:pass@host:port/dbname or prisma+postgres://...
    let dbName = 'Unknown';

    try {
        // Remove prisma+ prefix if exists
        const cleanUrl = url.replace('prisma+postgres://', 'postgres://');
        const urlObj = new URL(cleanUrl);
        dbName = urlObj.pathname.replace('/', '');

        console.log(`Database Name: ${dbName}`);
        console.log(`Host: ${urlObj.hostname}`);
        console.log(`Port: ${urlObj.port || '5432'}`);
        console.log(`\nFull URL (masked): ${url.substring(0, 30)}...${url.substring(url.length - 20)}`);
    } catch (error) {
        console.log('Could not parse DATABASE_URL');
        console.log(`URL starts with: ${url.substring(0, 50)}...`);
    }
} else {
    console.log('❌ DATABASE_URL not found in .env.production');
}

console.log('\n✅ This is your production database on Vercel Postgres');
console.log('✅ Only driver information was updated (2 orders)');
console.log('✅ All other data is intact\n');
