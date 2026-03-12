const { Client } = require('pg');
const config = {
  connectionString: 'postgresql://budolpostgres:r00tPassword2026!@budol-db-restored.cnu6imkq689x.ap-southeast-1.rds.amazonaws.com:5432/budolshap_1db',
  ssl: { rejectUnauthorized: false }
};

async function check() {
  const client = new Client(config);
  try {
    await client.connect();
    console.log("Connected to budolshap_1db");
    
    const schemas = await client.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog');");
    console.log("Schemas:", schemas.rows.map(r => r.schema_name).join(', '));

    for (const schema of schemas.rows.map(r => r.schema_name)) {
      console.log(`\n--- Schema: ${schema} ---`);
      const tables = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = '${schema}';`);
      tables.rows.forEach(t => console.log(` - ${t.table_name}`));
      
      const productTable = tables.rows.find(t => t.table_name.toLowerCase() === 'product');
      if (productTable) {
        const count = await client.query(`SELECT COUNT(*) FROM "${schema}"."${productTable.table_name}";`);
        console.log(` >> [MATCH] Product count in ${schema}: ${count.rows[0].count}`);
      }

      const appTable = tables.rows.find(t => t.table_name.toLowerCase() === 'ecosystemapp');
      if (appTable) {
        const count = await client.query(`SELECT COUNT(*) FROM "${schema}"."${appTable.table_name}";`);
        console.log(` >> [MATCH] EcosystemApp count in ${schema}: ${count.rows[0].count}`);
      }
    }

  } catch (err) {
    console.error("Connection error:", err.message);
  } finally {
    await client.end();
  }
}

check();
