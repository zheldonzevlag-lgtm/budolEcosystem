const { Client } = require('pg');
const url = 'postgresql://neondb_owner:npg_XLkrx73JNlRP@ep-wandering-breeze-aoin4z9c-pooler.c-2.ap-southeast-1.aws.neon.tech/budolpay?sslmode=require&schema=budolpay';
const client = new Client({ connectionString: url });
client.connect().then(async () => {
    // Check if user exists
    const check = await client.query('SELECT id FROM budolpay."User" WHERE email = $1', ['galvezjon59@gmail.com']);
    if (check.rows.length > 0) {
        console.log('User already exists:', check.rows[0]);
        await client.end();
        return;
    }
    
    // Add user
    const res = await client.query(`
        INSERT INTO budolpay."User" (id, email, "firstName", "lastName", "phoneNumber", role, "passwordHash", "kycStatus", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING id, email, role
    `, ['galvezjon59@gmail.com', 'Jon', 'Galvez', '+639484099403', 'ADMIN', 'SSO_MANAGED', 'VERIFIED']);
    
    console.log('User added:', res.rows[0]);
    await client.end();
}).catch(e => console.error(e));