const { Client } = require('pg');

exports.handler = async (event) => {
    const databases = ['budolid', 'budolpay', 'budolshap', 'budolaccounting'];
    const results = {};

    for (const db of databases) {
        const client = new Client({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: db,
            port: 5432,
            ssl: { rejectUnauthorized: false }
        });

        try {
            await client.connect();
            const res = await client.query('SELECT count(*) FROM information_schema.tables WHERE table_schema = \'public\'');
            results[db] = { table_count: res.rows[0].count };
            
            // Try to get record count from a common table if possible, e.g., 'User' or 'Product'
            try {
                if (db === 'budolshap') {
                    const prodRes = await client.query('SELECT count(*) FROM \"Product\"');
                    results[db].product_count = prodRes.rows[0].count;
                }
            } catch (e) {
                results[db].error = e.message;
            }
        } catch (err) {
            results[db] = { error: err.message };
        } finally {
            await client.end();
        }
    }

    return { statusCode: 200, body: results };
};
