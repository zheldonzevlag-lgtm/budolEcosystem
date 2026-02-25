import { NextResponse } from 'next/server';

/**
 * Health check endpoint for System Service
 * GET /api/internal/system/health
 */
export async function GET() {
    try {
        // Check database connection
        const { prisma } = await import('@/lib/prisma');
        await prisma.$queryRaw`SELECT 1`;
        
        return NextResponse.json({
            status: 'healthy',
            service: 'system',
            timestamp: new Date().toISOString(),
            checks: {
                database: 'connected'
            }
        });
    } catch (error) {
        return NextResponse.json({
            status: 'unhealthy',
            service: 'system',
            timestamp: new Date().toISOString(),
            error: error.message
        }, { status: 503 });
    }
}




