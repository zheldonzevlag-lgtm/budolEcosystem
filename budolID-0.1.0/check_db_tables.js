const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://budolpostgres:r00tPassword2026!@budol-db-production.cnu6imkq689x.ap-southeast-1.rds.amazonaws.com:5432/budolid',
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(() => {
    console.log("Connected to budolid database.");
    return client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public';");
  })
  .then(res => {
    console.log("\nTABLES in public schema:");
    res.rows.forEach(r => console.log(` - ${r.table_name}`));
    if (res.rows.find(r => r.table_name === 'EcosystemApp')) {
        return client.query("SELECT COUNT(*) FROM \"EcosystemApp\";").then(c => {
            console.log(`\nEcosystemApp count: ${c.rows[0].count}`);
        });
    }
  })
  .catch(console.error)
  .finally(() => client.end());
