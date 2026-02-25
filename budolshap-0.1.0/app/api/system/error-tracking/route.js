import { NextResponse } from 'next/server';
import { getErrorTrackingConfig, updateErrorTrackingConfig, getErrorTrackingStatus } from '@/lib/services/errorTrackingService';
import { requireAdmin } from '@/lib/adminAuth';

/**
 * Public Error Tracking Configuration API
 * GET /api/system/error-tracking - Get error tracking configuration and status
 * PUT /api/system/error-tracking - Update error tracking configuration
 * 
 * Phase 6: Error tracking service configuration
 */
export async function GET(request) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const status = await getErrorTrackingStatus();
        const config = await getErrorTrackingConfig();
        
        return NextResponse.json({
            ...status,
            config: {
                environment: config.environment,
                tracesSampleRate: config.tracesSampleRate,
                sentryDsn: config.sentryDsn ? '***configured***' : null
            }
        });
    } catch (error) {
        console.error('[Public API] GET /api/system/error-tracking Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get error tracking status' },
            { status: 500 }
        );
    }
}

export async function PUT(request) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const body = await request.json();
        const { enabled, sentryDsn, environment, tracesSampleRate } = body;

        const settings = await updateErrorTrackingConfig({
            enabled: enabled !== undefined ? enabled : false,
            sentryDsn,
            environment,
            tracesSampleRate
        });

        // Sync settings to .env.local (optional - can be done manually)
        try {
            const { execSync } = await import('child_process');
            const path = await import('path');
            const scriptPath = path.join(process.cwd(), 'scripts', 'sync-sentry-config.mjs');
            execSync(`node "${scriptPath}"`, { stdio: 'ignore' });
        } catch (syncError) {
            console.warn('[Error Tracking API] Failed to auto-sync to .env.local:', syncError.message);
            // Don't fail the request if sync fails
        }

        return NextResponse.json({
            success: true,
            message: 'Error tracking configuration updated successfully. Please run "npm run sync:sentry" and restart the application for changes to take effect.',
            settings: {
                errorTrackingEnabled: settings.errorTrackingEnabled,
                sentryEnvironment: settings.sentryEnvironment,
                sentryTracesSampleRate: settings.sentryTracesSampleRate,
                sentryDsn: settings.sentryDsn ? '***configured***' : null
            }
        });
    } catch (error) {
        console.error('[Public API] PUT /api/system/error-tracking Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update error tracking configuration' },
            { status: 500 }
        );
    }
}

