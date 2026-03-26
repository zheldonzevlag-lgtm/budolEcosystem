// restore-to-vercel.js
// Correctly handles pg_dump plain-text format including multi-line COPY headers.
// Connects via pg driver directly to db.prisma.io (Vercel Prisma Postgres).

import pkg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pkg;

const VERCEL_DB_URL =
  "postgres://63eff3860e4713f2156a5a6fad51bf84aa23f0018561ee0aa98bc1d2465ba02f:sk_1K0T2X4hoL6Z0F6NsgLdn@db.prisma.io:5432/postgres?sslmode=require";

const SQL_FILE = path.resolve('../budolshap_1db_vercel_ready.sql');

/**
 * Parse pg_dump plain SQL into DDL/DML and COPY data units.
 * Handles multi-line COPY headers (pg_dump wraps long column lists).
 */
function parseSqlFile(content) {
  const sqlUnits = [];
  const copyUnits = [];

  // Split by the COPY block terminator '\.' on its own line
  // Strategy: find all COPY blocks first, then parse the rest as DDL
  const copyBlockRegex = /^COPY\s+[\s\S]+?FROM stdin;\n([\s\S]*?)\n\\\./gm;

  let match;
  const copyMatches = [];
  while ((match = copyBlockRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const cmdEndIdx = fullMatch.indexOf('FROM stdin;') + 'FROM stdin;'.length;
    const cmd = fullMatch.slice(0, cmdEndIdx).replace(/\n/g, ' ').trim();
    const dataSection = match[1];
    const rows = dataSection.split('\n').filter(r => r.trim());
    copyMatches.push({ cmd, rows, start: match.index, end: match.index + fullMatch.length });
    copyUnits.push({ type: 'copy', cmd, data: rows });
  }

  // Remove COPY blocks from content to get DDL
  let ddlContent = content;
  // Remove them in reverse order to preserve indices
  for (const c of [...copyMatches].reverse()) {
    ddlContent = ddlContent.slice(0, c.start) + ddlContent.slice(c.end);
  }

  // Parse DDL statements (split by semicolons)
  // Use a simple approach: collect lines until we hit a ; at end of line
  const lines = ddlContent.split('\n');
  let buf = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('--')) continue;
    buf.push(line);
    const joined = buf.join(' ').trim();
    if (joined.endsWith(';')) {
      sqlUnits.push(joined);
      buf = [];
    }
  }

  return { sqlUnits, copyUnits };
}

async function executeCopyBlock(client, copyCmd, data) {
  // Parse table and columns from COPY command
  const match = copyCmd.match(/^COPY\s+([\w."]+)\s*\(([^)]+)\)\s+FROM stdin;?$/i);
  if (!match) {
    console.warn(`[COPY] Cannot parse: ${copyCmd.slice(0, 120)}`);
    return { success: 0, error: 1 };
  }

  const tableName = match[1];
  const columns = match[2].split(',').map(c => c.trim());
  let inserted = 0;
  let errors = 0;

  for (const row of data) {
    if (!row.trim()) continue;
    const values = row.split('\t');
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    // Convert \N to null
    const params = values.map(v => (v === '\\N' ? null : v));

    const insertSql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING;`;
    try {
      await client.query(insertSql, params);
      inserted++;
    } catch (err) {
      errors++;
      if (errors <= 3) {
        console.warn(`  [ERR] ${tableName}: ${err.message.slice(0, 150)}`);
      }
    }
  }

  return { success: inserted, error: errors };
}

async function restore() {
  console.log('[RESTORE] Connecting to Vercel Postgres...');
  const client = new Client({
    connectionString: VERCEL_DB_URL,
    ssl: { rejectUnauthorized: false },
    statement_timeout: 60000,
    connectionTimeoutMillis: 30000,
  });

  try {
    await client.connect();
    console.log('[RESTORE] Connected.');

    const sql = fs.readFileSync(SQL_FILE, 'utf8');
    console.log(`[RESTORE] File size: ${(sql.length / 1024).toFixed(1)} KB`);

    const { sqlUnits, copyUnits } = parseSqlFile(sql);
    console.log(`[RESTORE] Parsed: ${sqlUnits.length} DDL statements, ${copyUnits.length} COPY blocks`);

    let sqlSuccess = 0, sqlErrors = 0;

    // Phase 1: DDL
    console.log('[RESTORE] === Phase 1: DDL/DML ===');
    for (let i = 0; i < sqlUnits.length; i++) {
      try {
        await client.query(sqlUnits[i]);
        sqlSuccess++;
      } catch (err) {
        sqlErrors++;
        if (!err.message.includes('already exists')) {
          console.warn(`[DDL ERR ${i + 1}] ${err.message.slice(0, 150)}`);
        }
      }
      if ((i + 1) % 50 === 0) console.log(`  Progress: ${i + 1}/${sqlUnits.length}`);
    }
    console.log(`[RESTORE] DDL: ${sqlSuccess} success, ${sqlErrors} errors`);

    // Phase 2: Data insertion
    console.log('[RESTORE] === Phase 2: Data Insertion ===');
    let totalInserted = 0, totalErrors = 0;
    for (let i = 0; i < copyUnits.length; i++) {
      const u = copyUnits[i];
      const tableMatch = u.cmd.match(/COPY\s+([\w."]+)/i);
      const tableName = tableMatch ? tableMatch[1] : 'unknown';
      process.stdout.write(`  [${i + 1}/${copyUnits.length}] ${tableName} (${u.data.length} rows)... `);
      const result = await executeCopyBlock(client, u.cmd, u.data);
      totalInserted += result.success;
      totalErrors += result.error;
      console.log(`-> inserted: ${result.success}, errors: ${result.error}`);
    }
    console.log(`[RESTORE] Data: ${totalInserted} rows inserted, ${totalErrors} errors`);

    // Phase 3: Verify
    console.log('\n[RESTORE] === Verification ===');
    const schemas = await client.query(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('public','budolid','budolpay');"
    );
    console.log('Schemas:', schemas.rows.map(r => r.schema_name).join(', '));

    const tables = await client.query(
      "SELECT table_schema, table_name, (SELECT COUNT(*) FROM information_schema.tables) as cnt FROM information_schema.tables WHERE table_schema IN ('public','budolid','budolpay') ORDER BY table_schema, table_name LIMIT 50;"
    );
    console.log('Tables created:', tables.rows.length);

    try {
      const prod = await client.query('SELECT COUNT(*) FROM "Product";');
      console.log(`Products: ${prod.rows[0].count}`);
    } catch (e) {
      try {
        const prod2 = await client.query('SELECT COUNT(*) FROM public."Product";');
        console.log(`Products (public): ${prod2.rows[0].count}`);
      } catch (e2) {
        console.warn('Product count error:', e2.message.slice(0, 100));
      }
    }

    try {
      const users = await client.query('SELECT COUNT(*) FROM budolid."User";');
      console.log(`Users (budolid): ${users.rows[0].count}`);
    } catch (e) {
      console.warn('User count error:', e.message.slice(0, 100));
    }

  } catch (err) {
    console.error('[RESTORE] FATAL:', err.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('[RESTORE] Done.');
  }
}

restore();
