const { Client } = require('pg');

async function main() {
    const client = new Client({
        connectionString: 'postgresql://neondb_owner:npg_1XunT0SskIwa@ep-bitter-wildflower-a1y0z1id-pooler.ap-southeast-1.aws.neon.tech/budolpay?sslmode=require',
    });

    await client.connect();

    const res = await client.query('SELECT schema_name FROM information_schema.schemata;');
    console.log(res.rows.map(r => r.schema_name).filter(s => !s.startsWith('pg_') && s !== 'information_schema'));

    await client.end();
}

main().catch(console.error);
