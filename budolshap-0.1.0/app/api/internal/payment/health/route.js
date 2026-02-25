import { NextResponse } from 'next/server';

/**
 * Health check endpoint for Payment Service
 * GET /api/internal/payment/health
 */
export async function GET() {
    try {
        // Check payment service dependencies
        const checks = {
            paymentService: 'available',
            paymongo: 'configured'
        };

        // Verify PayMongo configuration
        if (!process.env.PAYMONGO_SECRET_KEY) {
            checks.paymongo = 'missing_key';
        }

        return NextResponse.json({
            status: checks.paymongo === 'configured' ? 'healthy' : 'degraded',
            service: 'payment',
            timestamp: new Date().toISOString(),
            checks
        });
    } catch (error) {
        return NextResponse.json({
            status: 'unhealthy',
            service: 'payment',
            timestamp: new Date().toISOString(),
            error: error.message
        }, { status: 503 });
    }
}




