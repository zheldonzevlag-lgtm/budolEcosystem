const { Client } = require('pg');
const url = 'postgresql://neondb_owner:npg_XLkrx73JNlRP@ep-wandering-breeze-aoin4z9c-pooler.c-2.ap-southeast-1.aws.neon.tech/budolpay?sslmode=require&schema=budolpay';
const client = new Client({ connectionString: url });
client.connect().then(async () => {
    const res = await client.query('SELECT key, hits, "expiresAt" FROM budolpay."RateLimit"');
    console.log('Found:', res.rows.length);
    res.rows.forEach(r => console.log(r.key, r.hits, r.expiresAt));
    await client.end();
}).catch(e => console.error(e));