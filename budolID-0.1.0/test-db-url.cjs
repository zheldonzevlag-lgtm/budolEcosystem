// WHY: Test if budolID schema exists on the budolPay Neon endpoint (ep-wandering-breeze)
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// The WORKING budolPay URL, but pointing to schema=budolid
const url = process.env.DATABASE_URL + '&schema=budolid';

console.log('Testing with URL (budolpay endpoint, budolid schema):', url.replace(/:[^:@]+@/, ':****@'));

const prisma = new PrismaClient({
    datasources: { db: { url } }
});

async function main() {
    try {
        await prisma.$connect();
        console.log('✅ Connected successfully');
        const schema = await prisma.$queryRaw`SELECT current_schema()`;
        console.log('Current schema:', schema);
        
        // Check if budolid tables exist
        const tables = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'budolid'
            ORDER BY table_name
        `;
        console.log('Tables in budolid schema:', tables.map(t => t.table_name));

        const userCount = await prisma.user.count();
        console.log('User count:', userCount);

        const apps = await prisma.ecosystemApp.findMany();
        console.log('Ecosystem apps:', apps.map(a => a.name));
    } catch (e) {
        console.error('❌ Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
