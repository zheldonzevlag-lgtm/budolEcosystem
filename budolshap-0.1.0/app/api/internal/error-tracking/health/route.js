import { NextResponse } from 'next/server';
import { getErrorTrackingStatus } from '@/lib/services/errorTrackingService';

/**
 * Health check endpoint for Error Tracking Service
 * GET /api/internal/error-tracking/health
 */
export async function GET() {
    try {
        const status = await getErrorTrackingStatus();
        
        return NextResponse.json({
            status: status.status === 'active' ? 'healthy' : (status.enabled ? 'degraded' : 'disabled'),
            service: 'error-tracking',
            timestamp: new Date().toISOString(),
            checks: {
                enabled: status.enabled,
                configured: status.configured,
                message: status.message
            }
        });
    } catch (error) {
        return NextResponse.json({
            status: 'unhealthy',
            service: 'error-tracking',
            timestamp: new Date().toISOString(),
            error: error.message
        }, { status: 503 });
    }
}

