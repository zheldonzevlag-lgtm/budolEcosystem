const { Client } = require('pg');

async function setupDatabase() {
    // Connection to postgres database (default)
    const adminClient = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'r00t',
        database: 'postgres', // Connect to default postgres database first
    });

    try {
        console.log('Connecting to PostgreSQL...');
        await adminClient.connect();
        console.log('✓ Connected to PostgreSQL');

        // Check if database exists
        const dbName = 'budolshap_db';
        const result = await adminClient.query(
            `SELECT 1 FROM pg_database WHERE datname = $1`,
            [dbName]
        );

        if (result.rows.length > 0) {
            console.log(`✓ Database '${dbName}' already exists`);
        } else {
            console.log(`Creating database '${dbName}'...`);
            await adminClient.query(`CREATE DATABASE ${dbName}`);
            console.log(`✓ Database '${dbName}' created successfully`);
        }

        await adminClient.end();
        console.log('\n✓ Database setup complete!');
        console.log('\nNext steps:');
        console.log('1. Run: npx prisma migrate dev --name init');
        console.log('2. Run: npm run dev');

    } catch (error) {
        console.error('Error setting up database:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('\nPostgreSQL is not running or not accessible on localhost:5432');
            console.error('Please check:');
            console.error('1. PostgreSQL service is running');
            console.error('2. PostgreSQL is configured to accept connections on port 5432');
            console.error('3. pg_hba.conf allows local connections');
        } else if (error.code === '28P01') {
            console.error('\nAuthentication failed. Please check:');
            console.error('1. Username is correct (currently: postgres)');
            console.error('2. Password is correct (currently: r00t)');
        }
        process.exit(1);
    }
}

setupDatabase();
