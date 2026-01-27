
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Attempting to connect to database...');
        console.log('DATABASE_URL starts with:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) : 'undefined');

        const count = await prisma.user.count();
        console.log(`✅ Connection successful! Found ${count} users.`);
    } catch (e) {
        console.error('❌ Connection failed:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
