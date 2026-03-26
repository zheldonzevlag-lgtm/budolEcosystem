// clean-sql.js
import fs from 'fs';

const SQL_FILE = "G:/IT/database-backup/budolshap.sql_txt";
const OUTPUT_FILE = "G:/IT/database-backup/budolshap_clean.sql";

async function main() {
    console.log('[CLEAN] Reading SQL file...');
    let text = fs.readFileSync(SQL_FILE, 'utf8');

    console.log('[CLEAN] Applying transformations...');
    
    // 1. Ensure schemas exist
    text = "CREATE SCHEMA IF NOT EXISTS budolid;\nCREATE SCHEMA IF NOT EXISTS budolpay;\nCREATE SCHEMA IF NOT EXISTS budolaccounting;\n" + text;

    // 2. Remove OWNER TO
    text = text.replace(/ALTER (TABLE|TYPE|VIEW|SEQUENCE|SCHEMA|FUNCTION|PROCEDURE|MATERIALIZED VIEW) .* OWNER TO .*?;/gi, '-- $&');

    // 3. Optional: Remove specific SET commands that often fail on cloud Postgres
    text = text.replace(/SET (default_table_access_method|default_tablespace) = .*?;/gi, '-- $&');
    
    // 4. Ensure search path is robust
    text = "SELECT pg_catalog.set_config('search_path', 'public, budolid, budolpay, budolaccounting', false);\n" + text;

    fs.writeFileSync(OUTPUT_FILE, text);
    console.log('[CLEAN] Done. Cleaned SQL saved to:', OUTPUT_FILE);
}

main().catch(console.error);
