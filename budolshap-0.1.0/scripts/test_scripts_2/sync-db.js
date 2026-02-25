
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Helper to load envs directly to avoid process.env pollution/confusion
function getEnv(filename) {
    const filePath = path.join(__dirname, '..', filename);
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf8');
    // Find DATABASE_URL, handle Windows line endings
    const match = content.match(/DATABASE_URL=(.+)/);
    return match ? match[1].trim().replace(/["']/g, '') : null;
}

async function main() {
    console.log('🔄 Prepare to Sync: Production -> Local');

    // 1. Get Credentials
    // Use the fresh pull from Vercel to ensure we get the Rich Data DB
    let sourceUrl = getEnv('.env.check_prod');
    const destUrl = getEnv('.env.connection.local');

    if (fs.existsSync(path.join(__dirname, '..', '.prod_db_url_temp'))) {
        sourceUrl = fs.readFileSync(path.join(__dirname, '..', '.prod_db_url_temp'), 'utf8').trim();
        console.log('Using OVERRIDE Source URL from temp file');
    }

    if (!sourceUrl || !destUrl) {
        console.error('❌ Failed to extract database URLs');
        console.log('Source:', sourceUrl ? 'Found' : 'Missing');
        console.log('Dest:', destUrl ? 'Found' : 'Missing');
        process.exit(1);
    }

    console.log('SOURCE (Prod):', sourceUrl.substring(0, 20) + '...');
    console.log('DEST (Local):', destUrl.substring(0, 20) + '...');

    // 2. Initialize Clients
    const source = new PrismaClient({ datasources: { db: { url: sourceUrl } } });
    const dest = new PrismaClient({ datasources: { db: { url: destUrl } } });

    try {
        // 3. Define the Sync Order (Parent -> Child for Insert)
        // We will execute 'deleteMany' in REVERSE order first.
        const models = [
            'SystemSettings',
            'WebhookEvent',
            'RateLimit',
            'User',
            'Address',
            'Store',
            'StoreAddress',
            'Wallet',
            'Transaction',
            'PayoutRequest',
            'Product',
            'Coupon',
            'Cart',
            'CartItem',
            'Order',
            'OrderItem',
            'Return',
            'Rating',
            'Chat',
            'Message',
            'AuditLog'
        ];

        console.log('\n🗑️  Cleaning Local Database (Reverse Order)...');
        for (let i = models.length - 1; i >= 0; i--) {
            const modelName = models[i];
            const modelNameLower = modelName.charAt(0).toLowerCase() + modelName.slice(1);
            if (dest[modelNameLower]) {
                process.stdout.write(`   Deleting ${modelName}... `);
                await dest[modelNameLower].deleteMany({});
                console.log('✅');
            }
        }

        console.log('\n📥 Transferring Data (Source -> Dest)...');

        for (const modelName of models) {
            const modelNameLower = modelName.charAt(0).toLowerCase() + modelName.slice(1);
            if (source[modelNameLower] && dest[modelNameLower]) {
                process.stdout.write(`   Syncing ${modelName}... `);

                // Fetch all
                const data = await source[modelNameLower].findMany();
                const count = data.length;

                if (count > 0) {
                    // Insert in batches or createMany
                    // createMany is faster
                    await dest[modelNameLower].createMany({
                        data: data,
                        skipDuplicates: true // Safety
                    });
                    console.log(`✅ Copied ${count} records`);
                } else {
                    console.log('➖ No records');
                }
            }
        }

        console.log('\n✅ Sync Complete! Local database matches Production.');

    } catch (e) {
        console.error('\n❌ Sync Failed:', e);
    } finally {
        await source.$disconnect();
        await dest.$disconnect();
    }
}

main();
