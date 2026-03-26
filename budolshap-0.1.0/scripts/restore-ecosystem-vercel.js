// restore-ecosystem-vercel.js
import fs from 'fs';
import pkg from 'pg';
const { Client } = pkg;

const VERCEL_DB_URL = "postgres://c0999becfdd24a3fdf0c431059e54af5b7f61cedbdd336a0c0b9ead004aa22bc:sk_m8mN6a7H1RaICj0gOw19i@db.prisma.io:5432/postgres?sslmode=require";
const SQL_FILE = "G:/IT/database-backup/budolshap.sql_txt";

async function main() {
    console.log('[RESTORE] Reading and cleaning SQL file...');
    let sql = fs.readFileSync(SQL_FILE, 'utf8');

    // Basic cleaning for Vercel compatibility
    sql = sql.replace(/CREATE SCHEMA (.*?);/g, 'CREATE SCHEMA IF NOT EXISTS $1;');
    sql = sql.replace(/ALTER (TABLE|TYPE|VIEW|SEQUENCE|SCHEMA|FUNCTION) .* OWNER TO .*?;/gi, '-- $&');
    sql = sql.replace(/SET .+?;/g, '-- $&'); // Strip some SET commands that might fail
    
    // Specifically handle CREATE TYPE (which doesn't have IF NOT EXISTS in Postgres < 17)
    // We'll wrap the script in a way or just let it fail if types exist.
    // Actually, splitting by semicolon and wrapping in TRYCATCH is safer for Vercel's proxy.

    const client = new Client({
        connectionString: VERCEL_DB_URL,
        ssl: { rejectUnauthorized: false },
        statement_timeout: 300000, // 5 mins
    });

    await client.connect();
    console.log('[RESTORE] Connected to Vercel Postgres.');

    // Split by statement (naively by semicolon + newline)
    const statements = sql.split(/;\s*\n/).filter(s => s.trim().length > 0);
    console.log(`[RESTORE] Processing ${statements.length} statements...`);

    let success = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i].trim() + ';';
        if (stmt.startsWith('--')) continue;

        try {
            await client.query(stmt);
            success++;
        } catch (err) {
            if (err.message.includes('already exists') || err.message.includes('already a member')) {
                skipped++;
            } else {
                failed++;
                if (failed < 10) {
                    console.warn(`  [ERR] Line ${i}: ${err.message.slice(0, 100)}`);
                    // console.log('  Stmt:', stmt.slice(0, 100));
                }
            }
        }
        if (i > 0 && i % 100 === 0) process.stdout.write(`  ...${i}/${statements.length} done\n`);
    }

    console.log(`\n[RESTORE] Finished.`);
    console.log(`  Success: ${success}`);
    console.log(`  Skipped (Existing): ${skipped}`);
    console.log(`  Failed (Unexpected): ${failed}`);

    // Final check for products
    const res = await client.query('SELECT COUNT(*) FROM public."Product"');
    console.log(`\n[VERIFY] Products on Vercel now: ${res.rows[0].count}`);

    await client.end();
}

main().catch(err => {
    console.error('[FATAL]', err);
    process.exit(1);
});
