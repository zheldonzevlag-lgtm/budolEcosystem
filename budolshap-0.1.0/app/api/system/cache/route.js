import { NextResponse } from 'next/server';
import { updateCacheConfig, getCacheStatus } from '@/lib/services/cacheService';
import { requireAdmin } from '@/lib/adminAuth';

/**
 * Public Cache Configuration API
 * GET /api/system/cache - Get cache configuration and status
 * PUT /api/system/cache - Update cache configuration
 * 
 * Phase 6: Cache service configuration
 */
export async function GET(request) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const status = await getCacheStatus();
        return NextResponse.json(status);
    } catch (error) {
        console.error('[Public API] GET /api/system/cache Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get cache status' },
            { status: 500 }
        );
    }
}

export async function PUT(request) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const body = await request.json();
        const { provider, redisUrl, redisPassword } = body;

        if (!provider) {
            return NextResponse.json(
                { error: 'Cache provider is required' },
                { status: 400 }
            );
        }

        const settings = await updateCacheConfig({
            provider,
            redisUrl,
            redisPassword
        });

        return NextResponse.json({
            success: true,
            message: 'Cache configuration updated successfully',
            settings: {
                cacheProvider: settings.cacheProvider,
                redisUrl: settings.redisUrl ? '***configured***' : null
            }
        });
    } catch (error) {
        console.error('[Public API] PUT /api/system/cache Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update cache configuration' },
            { status: 500 }
        );
    }
}




