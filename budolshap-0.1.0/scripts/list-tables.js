import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client-custom';

async function main() {
    console.log('Listing tables in database...');
    const prisma = new PrismaClient();
    try {
        await prisma.$connect();
        // Use raw query to list tables
        const result = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        console.log('Tables found:', result);
    } catch (error) {
        console.error('Error listing tables:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
