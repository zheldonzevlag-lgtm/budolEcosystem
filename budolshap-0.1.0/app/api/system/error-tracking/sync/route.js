import { NextResponse } from 'next/server';
import { getErrorTrackingConfig } from '@/lib/services/errorTrackingService';
import { verifyTokenEdge } from '@/lib/token-edge';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';



/**
 * Sync Sentry Configuration API
 * POST /api/system/error-tracking/sync - Sync error tracking settings to environment variables
 * 
 * This endpoint syncs database settings to .env.local (local development) or validates settings (Vercel)
 * 
 * Body: { targetEnvironment: 'development' | 'production' }
 */
export async function POST(request) {
    try {
        // Verify admin access
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyTokenEdge(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get target environment from request body
        const body = await request.json().catch(() => ({}));
        const targetEnvironment = body.targetEnvironment || 'development'; // 'development' or 'production'

        // Get settings from database
        const settings = await prisma.systemSettings.findUnique({
            where: { id: 'default' }
        });

        if (!settings) {
            return NextResponse.json({
                success: false,
                error: 'No system settings found. Please configure error tracking first.'
            }, { status: 404 });
        }

        // Determine if we should write to file or show instructions
        // If target is 'production', always show Vercel instructions
        // If target is 'development', try to write to .env.local
        const shouldWriteToFile = targetEnvironment === 'development';
        
        // Check if we're actually in Vercel (read-only filesystem)
        const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
        const isProduction = process.env.NODE_ENV === 'production';

        // If target is production OR we're actually in Vercel, show instructions
        if (targetEnvironment === 'production' || (isVercel && !shouldWriteToFile)) {
            // Production/Vercel: Can't write to .env.local
            // Instead, validate and return instructions
            const config = {
                ERROR_TRACKING_ENABLED: settings.errorTrackingEnabled ? 'true' : 'false',
                SENTRY_DSN: settings.sentryDsn || '',
                NEXT_PUBLIC_SENTRY_DSN: settings.sentryDsn || '',
                SENTRY_ENVIRONMENT: settings.sentryEnvironment || 'production',
                NEXT_PUBLIC_SENTRY_ENVIRONMENT: settings.sentryEnvironment || 'production',
                SENTRY_TRACES_SAMPLE_RATE: (settings.sentryTracesSampleRate || 0.1).toString(),
                NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: (settings.sentryTracesSampleRate || 0.1).toString()
            };

            return NextResponse.json({
                success: true,
                message: `Configuration validated for ${targetEnvironment === 'production' ? 'Production (Vercel)' : 'Vercel'}. Environment variables must be set in Vercel dashboard.`,
                isVercel: true,
                targetEnvironment: targetEnvironment,
                config: config,
                instructions: [
                    'Go to Vercel Dashboard → Your Project → Settings → Environment Variables',
                    'Add or update the following variables:',
                    ...Object.entries(config).map(([key, value]) => `  ${key}=${value}`),
                    'Select the appropriate environment (Production, Preview, or Development)',
                    'Redeploy your application for changes to take effect'
                ]
            });
        }

        // Local development: Write to .env.local
        try {
            const envPath = path.join(process.cwd(), '.env.local');
            let envContent = '';
            
            if (fs.existsSync(envPath)) {
                envContent = fs.readFileSync(envPath, 'utf8');
            }

            // Update or add Sentry environment variables
            const updates = {
                'ERROR_TRACKING_ENABLED': settings.errorTrackingEnabled ? 'true' : 'false',
                'SENTRY_DSN': settings.sentryDsn || '',
                'NEXT_PUBLIC_SENTRY_DSN': settings.sentryDsn || '',
                'SENTRY_ENVIRONMENT': settings.sentryEnvironment || 'production',
                'NEXT_PUBLIC_SENTRY_ENVIRONMENT': settings.sentryEnvironment || 'production',
                'SENTRY_TRACES_SAMPLE_RATE': (settings.sentryTracesSampleRate || 0.1).toString(),
                'NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE': (settings.sentryTracesSampleRate || 0.1).toString()
            };

            // Update existing lines or add new ones
            let updated = false;
            for (const [key, value] of Object.entries(updates)) {
                const regex = new RegExp(`^${key}=.*$`, 'm');
                if (regex.test(envContent)) {
                    envContent = envContent.replace(regex, `${key}=${value}`);
                    updated = true;
                } else {
                    envContent += `\n${key}=${value}`;
                    updated = true;
                }
            }

            // Write back to .env.local
            if (updated) {
                fs.writeFileSync(envPath, envContent, 'utf8');
            }

            await prisma.$disconnect();

            return NextResponse.json({
                success: true,
                message: 'Sentry configuration synced to .env.local successfully. Please restart your local development server.',
                targetEnvironment: 'development',
                config: {
                    errorTrackingEnabled: settings.errorTrackingEnabled,
                    environment: settings.sentryEnvironment || 'production',
                    tracesSampleRate: settings.sentryTracesSampleRate || 0.1,
                    sentryDsn: settings.sentryDsn ? '***configured***' : null
                },
                isVercel: false
            });
        } catch (fileError) {
            await prisma.$disconnect();
            console.error('[Sync API] File write error:', fileError);
            return NextResponse.json({
                success: false,
                error: `Failed to write to .env.local: ${fileError.message}`,
                isVercel: false
            }, { status: 500 });
        }
    } catch (error) {
        console.error('[Sync API] Error:', error);
        await prisma.$disconnect();
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to sync Sentry configuration'
        }, { status: 500 });
    }
}

