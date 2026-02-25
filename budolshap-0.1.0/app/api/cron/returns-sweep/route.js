import { NextResponse } from 'next/server';
import { processOverdueReturns } from '@/lib/services/returnsService';

export const maxDuration = 60; // Allow 1 minute

export async function GET(request) {
    // Basic security check
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-cron-secret';

    if (authHeader !== `Bearer ${cronSecret}`) {
        const { searchParams } = new URL(request.url);
        if (searchParams.get('key') !== cronSecret) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        const result = await processOverdueReturns();

        return NextResponse.json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error('[ReturnsSweepCron] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
