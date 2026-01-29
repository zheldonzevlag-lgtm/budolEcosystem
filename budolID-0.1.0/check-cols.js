
const { PrismaClient } = require('./generated/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const schemaName = 'budolid';
        console.log(`Checking columns for budolid.User...`);
        const res = await prisma.$queryRaw`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = ${schemaName} 
            AND table_name = 'User'
        `;
        console.log('Columns found:', res.map(r => r.column_name));
        
        const apps = await prisma.$queryRaw`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = ${schemaName} 
            AND table_name = 'EcosystemApp'
        `;
        console.log('EcosystemApp columns:', apps.map(r => r.column_name));
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
