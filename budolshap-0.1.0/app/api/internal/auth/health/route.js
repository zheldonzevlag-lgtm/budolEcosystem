import { NextResponse } from 'next/server';

/**
 * Health check endpoint for Auth Service
 * GET /api/internal/auth/health
 */
export async function GET() {
    try {
        // Check database connection
        const { prisma } = await import('@/lib/prisma');
        await prisma.$queryRaw`SELECT 1`;
        
        return NextResponse.json({
            status: 'healthy',
            service: 'auth',
            timestamp: new Date().toISOString(),
            checks: {
                database: 'connected'
            }
        });
    } catch (error) {
        return NextResponse.json({
            status: 'unhealthy',
            service: 'auth',
            timestamp: new Date().toISOString(),
            error: error.message
        }, { status: 503 });
    }
}




