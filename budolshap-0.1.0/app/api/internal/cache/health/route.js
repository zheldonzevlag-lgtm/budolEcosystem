import { NextResponse } from 'next/server';
import { getCacheStatus } from '@/lib/services/cacheService';

/**
 * Health check endpoint for Cache Service
 * GET /api/internal/cache/health
 */
export async function GET() {
    try {
        const status = await getCacheStatus();
        
        return NextResponse.json({
            status: status.status === 'connected' || status.status === 'active' ? 'healthy' : 'degraded',
            service: 'cache',
            timestamp: new Date().toISOString(),
            checks: {
                provider: status.provider,
                connection: status.status,
                message: status.message
            }
        });
    } catch (error) {
        return NextResponse.json({
            status: 'unhealthy',
            service: 'cache',
            timestamp: new Date().toISOString(),
            error: error.message
        }, { status: 503 });
    }
}




