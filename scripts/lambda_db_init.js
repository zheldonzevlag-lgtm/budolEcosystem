const { Client } = require('pg');

exports.handler = async (event) => {
    const config = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'postgres',
        port: 5432,
        ssl: {
            rejectUnauthorized: false
        }
    };

    const databases = ['budolid', 'budolpay', 'budolshap', 'budolaccounting', 'budolloan'];
    const client = new Client(config);

    try {
        await client.connect();

        for (const db of databases) {
            try {
                // Check if database exists
                const res = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [db]);
                if (res.rowCount === 0) {
                    await client.query(`CREATE DATABASE ${db}`);
                    console.log(`Database ${db} created successfully.`);
                } else {
                    console.log(`Database ${db} already exists.`);
                }
            } catch (err) {
                console.error(`Error creating database ${db}:`, err.message);
            }
        }
    } catch (err) {
        console.error('Connection error:', err.stack);
        return { statusCode: 500, body: 'Error: ' + err.message };
    } finally {
        await client.end();
    }

    return { statusCode: 200, body: 'Database initialization complete' };
};
