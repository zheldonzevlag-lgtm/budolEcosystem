import pkg from 'pg';
const { Client } = pkg;

const connectionString = "postgres://63eff3860e4713f2156a5a6fad51bf84aa23f0018561ee0aa98bc1d2465ba02f:sk_1K0T2X4hoL6Z0F6NsgLdn@db.prisma.io:5432/postgres?sslmode=require";

async function check() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected!');
    const res = await client.query("SELECT schema_name FROM information_schema.schemata;");
    console.log('Schemas:', res.rows.map(r => r.schema_name));
    await client.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

check();
