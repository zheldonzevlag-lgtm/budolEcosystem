import { NextResponse } from 'next/server';
import { 
    getSystemSettings, 
    updateSystemSettings 
} from '@/lib/services/systemSettingsService';

/**
 * Internal System Settings API
 * GET /api/internal/system/settings
 * PUT /api/internal/system/settings
 */
export async function GET() {
    try {
        const settings = await getSystemSettings();
        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const updated = await updateSystemSettings(body);
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}




