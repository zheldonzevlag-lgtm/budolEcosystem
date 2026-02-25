
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Helper to load envs directly
function getEnv(filename) {
    const filePath = path.join(__dirname, '..', filename);
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/DATABASE_URL=(.+)/);
    return match ? match[1].trim().replace(/["']/g, '') : null;
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function main() {
    console.log('⚠️  WARNING: You are about to overwrite PRODUCTION data with LOCAL data.');
    console.log('⚠️  This will DELETE all existing records in Production.');

    // 1. Get Credentials (REVERSED)
    const sourceUrl = getEnv('.env.connection.local');
    const destUrl = getEnv('.env.check_prod') || getEnv('.env.connection.prod');

    if (!sourceUrl || !destUrl) {
        console.error('❌ Failed to extract database URLs');
        process.exit(1);
    }

    console.log('\nSOURCE (Local):', sourceUrl.substring(0, 30) + '...');
    console.log('DEST (Prod): ', destUrl.substring(0, 30) + '...');

    // 2. Safety Prompt
    rl.question('\nType "CONFIRM_PROD_OVERWRITE" to proceed: ', async (answer) => {
        if (answer !== 'CONFIRM_PROD_OVERWRITE') {
            console.log('❌ Operation cancelled.');
            process.exit(0);
        }

        console.log('\n🚀 Starting Push to Production...');
        await runSync(sourceUrl, destUrl);
        process.exit(0);
    });
}

async function runSync(sourceUrl, destUrl) {
    const source = new PrismaClient({ datasources: { db: { url: sourceUrl } } });
    const dest = new PrismaClient({ datasources: { db: { url: destUrl } } });

    try {
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

        console.log('\n🗑️  Cleaning PRODUCTION Database...');
        for (let i = models.length - 1; i >= 0; i--) {
            const modelName = models[i];
            const modelNameLower = modelName.charAt(0).toLowerCase() + modelName.slice(1);
            if (dest[modelNameLower]) {
                process.stdout.write(`   Deleting ${modelName}... `);
                await dest[modelNameLower].deleteMany({});
                console.log('✅');
            }
        }

        console.log('\n📤 Pushing Data (Local -> Prod)...');
        for (const modelName of models) {
            const modelNameLower = modelName.charAt(0).toLowerCase() + modelName.slice(1);
            if (source[modelNameLower] && dest[modelNameLower]) {
                process.stdout.write(`   Pushing ${modelName}... `);
                const data = await source[modelNameLower].findMany();

                if (data.length > 0) {
                    await dest[modelNameLower].createMany({
                        data: data,
                        skipDuplicates: true
                    });
                    console.log(`✅ (${data.length})`);
                } else {
                    console.log('➖');
                }
            }
        }

        console.log('\n✅ Push Complete! Production matches Local.');

    } catch (e) {
        console.error('\n❌ Push Failed:', e);
    } finally {
        await source.$disconnect();
        await dest.$disconnect();
    }
}

main();
