import { NextResponse } from 'next/server';
import { getRealtimeConfig } from '@/lib/services/systemSettingsService';
import { requireAdmin } from '@/lib/adminAuth';
import { clearSettingsCache } from '@/lib/realtime';

/**
 * Public Realtime Config API
 * GET /api/system/realtime
 */
export async function GET(request) {
    // We allow GET for public config, but some fields might need to be filtered in the future
    try {
        const config = await getRealtimeConfig();
        return NextResponse.json(config);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        // 2. Update Settings
        const body = await request.json();

        // Validate provider
        if (body.provider && !['POLLING', 'PUSHER', 'SOCKET_IO'].includes(body.provider)) {
            return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
        }

        const data = {
            realtimeProvider: body.provider,
            ...(body.pusherKey !== undefined && { pusherKey: body.pusherKey }),
            ...(body.pusherCluster !== undefined && { pusherCluster: body.pusherCluster }),
            ...(body.pusherAppId !== undefined && { pusherAppId: body.pusherAppId }),
            ...(body.pusherSecret !== undefined && { pusherSecret: body.pusherSecret }),
            ...(body.socketUrl !== undefined && { socketUrl: body.socketUrl }),
            ...(body.swrPollingInterval !== undefined && { swrPollingInterval: body.swrPollingInterval }),
        };

        const { updateSystemSettings } = await import('@/lib/services/systemSettingsService');
        const settings = await updateSystemSettings(data);

        // Clear realtime settings cache to ensure immediate update
        clearSettingsCache();

        return NextResponse.json(settings);

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
