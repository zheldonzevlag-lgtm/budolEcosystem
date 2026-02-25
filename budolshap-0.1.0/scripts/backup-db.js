const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function backupDatabase() {
    const date = new Date().toISOString().split('T')[0];
    const backupDir = path.join(process.cwd(), 'backup-db', `db-${date}`);

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log(`Starting database backup to ${backupDir}...`);

    try {
        // Get all model names from Prisma
        // Note: Prisma Client doesn't expose model names directly in a simple list in all versions,
        // but we can iterate over known models or use $queryRaw to get table names.
        // For simplicity/safety, I'll list the key models based on schema knowledge.
        // If I miss some, I should check schema.prisma.
        
        // Let's try to get all table names first
        const tablenames = await prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname='public'`;
        
        for (const { tablename } of tablenames) {
            if (tablename === '_prisma_migrations') continue;

            console.log(`Backing up table: ${tablename}`);
            
            // We can't use dynamic model access easily like prisma[tablename] because tablenames are snake_case 
            // and prisma models are camelCase/PascalCase.
            // So we use raw query to dump data.
            
            const data = await prisma.$queryRawUnsafe(`SELECT * FROM "${tablename}"`);
            
            fs.writeFileSync(
                path.join(backupDir, `${tablename}.json`),
                JSON.stringify(data, null, 2)
            );
        }

        console.log('Database backup completed successfully!');
    } catch (error) {
        console.error('Backup failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

backupDatabase();
