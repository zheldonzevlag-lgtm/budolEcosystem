import { NextResponse } from 'next/server';
import { getRealtimeConfig } from '@/lib/services/systemSettingsService';

/**
 * Internal Realtime Config API
 * GET /api/internal/system/realtime
 */
export async function GET() {
    try {
        const config = await getRealtimeConfig();
        return NextResponse.json(config);
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}




