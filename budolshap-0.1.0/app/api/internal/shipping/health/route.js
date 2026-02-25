import { NextResponse } from 'next/server';

/**
 * Health check endpoint for Shipping Service
 * GET /api/internal/shipping/health
 */
export async function GET() {
    try {
        // Check database connection
        const { prisma } = await import('@/lib/prisma');
        await prisma.$queryRaw`SELECT 1`;
        
        // Check shipping factory availability
        let shippingFactoryAvailable = false;
        try {
            const shippingFactory = require('@/services/shippingFactory');
            shippingFactoryAvailable = !!shippingFactory;
        } catch (_error) {
            // Shipping factory not available
        }
        
        return NextResponse.json({
            status: shippingFactoryAvailable ? 'healthy' : 'degraded',
            service: 'shipping',
            timestamp: new Date().toISOString(),
            checks: {
                database: 'connected',
                shippingFactory: shippingFactoryAvailable ? 'available' : 'unavailable'
            }
        });
    } catch (error) {
        return NextResponse.json({
            status: 'unhealthy',
            service: 'shipping',
            timestamp: new Date().toISOString(),
            error: error.message
        }, { status: 503 });
    }
}




