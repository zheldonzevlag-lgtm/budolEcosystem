// manual-data-sync.js
import fs from 'fs';
import pkg from 'pg';
const { Client } = pkg;

const VERCEL_DB_URL = "postgres://c0999becfdd24a3fdf0c431059e54af5b7f61cedbdd336a0c0b9ead004aa22bc:sk_m8mN6a7H1RaICj0gOw19i@db.prisma.io:5432/postgres?sslmode=require";
const SQL_PATH = "G:/IT/database-backup/budolshap_clean.sql";

async function main() {
    const text = fs.readFileSync(SQL_PATH, 'utf8');
    const client = new Client({
        connectionString: VERCEL_DB_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    console.log('[SYNC] Connected to Vercel DB.');

    // We sync from multiple schemas now
    const tablesToSync = [
        'public."Category"', 
        'public."Product"', 
        'budolid."User"', 
        'budolpay."Wallet"',
        'public."User"',
        'budolpay."User"'
    ];

    for (const tableName of tablesToSync) {
        console.log(`[SYNC] Syncing ${tableName}...`);
        
        const startMarker = `COPY ${tableName} (`;
        const startIdx = text.indexOf(startMarker);
        if (startIdx === -1) {
            console.warn(`  [WARN] Could not find ${startMarker}`);
            continue;
        }

        const headerLineEnd = text.indexOf('FROM stdin;', startIdx);
        const header = text.substring(startIdx + startMarker.length, headerLineEnd).trim();
        const columns = header.replace(/\)/g, '').split(',').map(c => c.trim().replace(/"/g, ''));
        
        const dataStart = headerLineEnd + 'FROM stdin;'.length + 1;
        const dataEnd = text.indexOf('\n\\.', dataStart);
        const rawData = text.substring(dataStart, dataEnd).trim();

        const lines = rawData.split('\n');
        const rows = [];
        for (let line of lines) {
            const vals = line.split('\t').map(v => (v === '\\N' ? null : v));
            if (vals.length === columns.length) {
                rows.push(vals);
            }
        }

        console.log(`  [SYNC] Parsed ${columns.length} columns and ${rows.length} rows.`);

        let inserted = 0;
        let errors = 0;

        for (const vals of rows) {
            const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
            const quotedCols = columns.map(c => `"${c}"`).join(', ');
            
            try {
                // Use a generic upsert on "id"
                await client.query(`INSERT INTO ${tableName} (${quotedCols}) VALUES (${placeholders}) ON CONFLICT (id) DO UPDATE SET "updatedAt" = EXCLUDED."updatedAt"`, vals);
                inserted++;
            } catch (err) {
                errors++;
                if (errors <= 3) console.warn(`    [ERR] ${err.message.slice(0, 50)}`);
            }
        }
        console.log(`  [SYNC] ${inserted} rows updated/inserted into ${tableName} (${errors} errors)`);
    }

    await client.end();
}

main().catch(console.error);
