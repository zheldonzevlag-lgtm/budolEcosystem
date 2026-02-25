const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('🚀 Checking Production Database Counts...');

// Load .env.production
const envPath = path.resolve(__dirname, '../.env.production');
if (!fs.existsSync(envPath)) {
    console.error('❌ .env.production not found');
    process.exit(1);
}

const envConfig = dotenv.parse(fs.readFileSync(envPath));
let databaseUrl = envConfig.DIRECT_URL || envConfig.POSTGRES_URL || envConfig.DATABASE_URL;

if (!databaseUrl) {
    console.error('❌ No database URL found in .env.production');
    process.exit(1);
}

// Clean URL
databaseUrl = databaseUrl.trim().replace(/^["']|["']$/g, '');
if (databaseUrl.startsWith('postgres://')) {
    databaseUrl = databaseUrl.replace('postgres://', 'postgresql://');
}

console.log('🔗 Connecting to:', databaseUrl.substring(0, 20) + '...');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: databaseUrl
        }
    }
});

async function checkCounts() {
    try {
        console.log('\n📊 Database Record Counts:');
        console.log('---------------------------');

        const models = [
            'user', 'store', 'product', 'order', 'address',
            'wallet', 'transaction', 'payoutRequest', 'return',
            'cart', 'rating', 'chat'
        ];

        for (const model of models) {
            try {
                if (prisma[model]) {
                    const count = await prisma[model].count();
                    console.log(`${model.padEnd(15)}: ${count}`);
                } else {
                    console.log(`${model.padEnd(15)}: [Model not found in Prisma Client]`);
                }
            } catch (e) {
                console.log(`${model.padEnd(15)}: Error - ${e.message.split('\n')[0]}`);
            }
        }
        console.log('---------------------------\n');
    } catch (error) {
        console.error('Generic Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkCounts();
