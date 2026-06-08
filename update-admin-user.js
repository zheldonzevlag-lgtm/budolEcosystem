const { Client } = require('pg');
const url = 'postgresql://neondb_owner:npg_XLkrx73JNlRP@ep-wandering-breeze-aoin4z9c-pooler.c-2.ap-southeast-1.aws.neon.tech/budolpay?sslmode=require&schema=budolpay';
const client = new Client({ connectionString: url });
client.connect().then(async () => {
    const res = await client.query(`
        UPDATE budolpay."User" 
        SET role = $1, "firstName" = $2, "lastName" = $3, "updatedAt" = NOW()
        WHERE email = $4
        RETURNING id, email, role, "firstName", "lastName"
    `, ['ADMIN', 'Jon', 'Galvez', 'galvezjon59@gmail.com']);
    console.log('Updated:', res.rows[0]);
    await client.end();
}).catch(e => console.error(e));