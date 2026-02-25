import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listTables() {
    try {
        const result = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
        console.log('Tables in DB:', result.map(r => r.table_name));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

listTables();
