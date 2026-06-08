const { Client } = require('pg');
const url = 'postgresql://neondb_owner:npg_XLkrx73JNlRP@ep-wandering-breeze-aoin4z9c-pooler.c-2.ap-southeast-1.aws.neon.tech/budolpay?sslmode=require&schema=budolpay';
const client = new Client({ connectionString: url });
client.connect().then(async () => {
    const res = await client.query('DELETE FROM budolpay."RateLimit" WHERE key = $1', ['auth_login_136.158.56.143']);
    console.log('Deleted:', res.rowCount, 'rows');
    await client.end();
}).catch(e => console.error(e));