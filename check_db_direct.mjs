import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://budolpostgres:r00tPassword2026!@budol-db-production.cnu6imkq689x.ap-southeast-1.rds.amazonaws.com:5432/budolid";

async function check() {
    const client = new Client({
        connectionString: connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log("Connected to RDS database.");

        const productCountResult = await client.query('SELECT count(*) FROM "Product"');
        console.log(`Product count: ${productCountResult.rows[0].count}`);

        const userCountResult = await client.query('SELECT count(*) FROM "User"');
        console.log(`User count: ${userCountResult.rows[0].count}`);

        const storeCountResult = await client.query('SELECT count(*) FROM "Store"');
        console.log(`Store count: ${storeCountResult.rows[0].count}`);

        if (productCountResult.rows[0].count > 0) {
            const products = await client.query('SELECT * FROM "Product" LIMIT 5');
            console.log("Sample Products:", JSON.stringify(products.rows, null, 2));
        }

        if (userCountResult.rows[0].count > 0) {
            const users = await client.query('SELECT id, name, email FROM "User" LIMIT 5');
            console.log("Sample Users:", JSON.stringify(users.rows, null, 2));
        }

    } catch (err) {
        console.error("Database connection error:", err.stack);
    } finally {
        await client.end();
    }
}

check();
