import { NextResponse } from 'next/server';

/**
 * Health check endpoint for Orders Service
 * GET /api/internal/orders/health
 */
export async function GET() {
    try {
        // Check database connection
        const { prisma } = await import('@/lib/prisma');
        await prisma.$queryRaw`SELECT 1`;
        
        return NextResponse.json({
            status: 'healthy',
            service: 'orders',
            timestamp: new Date().toISOString(),
            checks: {
                database: 'connected'
            }
        });
    } catch (error) {
        return NextResponse.json({
            status: 'unhealthy',
            service: 'orders',
            timestamp: new Date().toISOString(),
            error: error.message
        }, { status: 503 });
    }
}




