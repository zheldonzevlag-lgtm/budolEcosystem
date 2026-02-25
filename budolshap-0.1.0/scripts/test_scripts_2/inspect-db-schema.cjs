const pg = require('../../budolpay-0.1.0/budolpay-app/node_modules/pg');

async function main() {
  const connectionString = "postgresql://postgres:r00t@localhost:5432/budolpay_db?schema=public";
  const pool = new pg.Pool({ connectionString });
  
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'User';
    `);
    console.log('Columns in User table (budolpay_db):');
    console.table(res.rows);
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await pool.end();
  }
}

main();
