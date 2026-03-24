const { Client } = require('pg');
const url = "postgresql://budolpostgres:r00tPassword2026!@budol-db-production.cnu6imkq689x.ap-southeast-1.rds.amazonaws.com:5432/budolshap_1db";

async function init() {
    const client = new Client({ connectionString: url });
    try {
        await client.connect();
        console.log("Connected to RDS. Creating schemas...");
        await client.query('CREATE SCHEMA IF NOT EXISTS budolid');
        await client.query('CREATE SCHEMA IF NOT EXISTS budolpay');
        await client.query('CREATE SCHEMA IF NOT EXISTS budolaccounting');
        console.log("Schemas created successfully.");
    } catch (err) {
        console.error("Error creating schemas:", err);
    } finally {
        await client.end();
    }
}
init();
