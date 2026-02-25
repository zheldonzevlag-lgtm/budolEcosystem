import dotenv from 'dotenv';
dotenv.config();

// Try importing from the custom location
import { PrismaClient } from '@prisma/client-custom';

async function main() {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not Set');
    
    if (!process.env.DATABASE_URL) {
        console.error('Error: DATABASE_URL is not set in environment variables.');
        process.exit(1);
    }

    const prisma = new PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
    });

    try {
        console.log('Attempting to connect...');
        await prisma.$connect();
        console.log('Successfully connected to database!');
        
        const userCount = await prisma.user.count();
        console.log(`User count: ${userCount}`);
        
    } catch (error) {
        console.error('Failed to connect to database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
