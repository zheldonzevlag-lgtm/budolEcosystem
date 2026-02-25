
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
    const envInfo = {
        DATABASE_URL: mask(process.env.DATABASE_URL),
        DIRECT_URL: mask(process.env.DIRECT_URL),
        POSTGRES_URL: mask(process.env.POSTGRES_URL),
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
    };

    let dbStats = { status: 'unknown' };
    // const prisma = new PrismaClient(); // Removed to use singleton

    try {
        const userCount = await prisma.user.count();
        const users = await prisma.user.findMany({ select: { email: true, name: true }, take: 5 });

        dbStats = {
            status: 'connected',
            userCount,
            sampleUsers: users
        };
    } catch (error) {
        dbStats = {
            status: 'error',
            message: error.message
        };
    } finally {
        await prisma.$disconnect();
    }

    return NextResponse.json({
        env: envInfo,
        db: dbStats,
        timestamp: new Date().toISOString()
    });
}

function mask(str) {
    if (!str) return 'NOT_SET';
    if (str.length < 20) return '***';
    // Show start and end to identify unique DBs
    return str.substring(0, 20) + '...' + str.substring(str.length - 10);
}
