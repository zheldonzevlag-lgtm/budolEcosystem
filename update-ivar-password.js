const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const url = 'postgresql://neondb_owner:npg_XLkrx73JNlRP@ep-wandering-breeze-aoin4z9c-pooler.c-2.ap-southeast-1.aws.neon.tech/budolpay?sslmode=require&schema=budolpay';
const client = new Client({ connectionString: url });

async function main() {
    await client.connect();
    const hash = await bcrypt.hash('Asakapa1!', 12);
    const res = await client.query(`
        UPDATE budolpay."User" 
        SET "passwordHash" = $1, "updatedAt" = NOW()
        WHERE email = $2
        RETURNING id, email, "firstName"
    `, [hash, 'ivarhanestad@gmail.com']);
    console.log('Updated:', res.rows[0]);
    await client.end();
}

main().catch(e => console.error(e));