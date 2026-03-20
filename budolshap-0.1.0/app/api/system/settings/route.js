import { NextResponse } from 'next/server';
import { getSystemSettings, updateSystemSettings } from '@/lib/services/systemSettingsService';
import { requireAdmin } from '@/lib/adminAuth';

/**
 * Public System Settings API
 * Can optionally call internal API for consistency
 * GET /api/system/settings
 */
export async function GET(request) {
    // We allow GET for public config, but some fields might need to be filtered in the future
    try {
        const settings = await getSystemSettings();
        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        // 2. Validate & Update
        const body = await request.json();

        // Clean payload but allow specific fields
        const data = {};

        // Realtime fields
        if (body.realtimeProvider) data.realtimeProvider = body.realtimeProvider;
        if (body.pusherKey !== undefined) data.pusherKey = body.pusherKey;
        if (body.pusherCluster !== undefined) data.pusherCluster = body.pusherCluster;
        if (body.pusherAppId !== undefined) data.pusherAppId = body.pusherAppId;
        if (body.pusherSecret !== undefined) data.pusherSecret = body.pusherSecret;
        if (body.socketUrl !== undefined) data.socketUrl = body.socketUrl;

        // Security fields
        if (body.sessionTimeout !== undefined) {
            const val = parseInt(body.sessionTimeout);
            if (!isNaN(val)) data.sessionTimeout = val;
        }
        if (body.sessionWarning !== undefined) {
            const val = parseInt(body.sessionWarning);
            if (!isNaN(val)) data.sessionWarning = val;
        }

        // Rate Limit fields
        if (body.loginLimit !== undefined) {
            const val = parseInt(body.loginLimit);
            if (!isNaN(val)) data.loginLimit = val;
        }
        if (body.registerLimit !== undefined) {
            const val = parseInt(body.registerLimit);
            if (!isNaN(val)) data.registerLimit = val;
        }

        // Cache fields
        if (body.cacheProvider !== undefined) data.cacheProvider = body.cacheProvider;
        if (body.redisPassword !== undefined) data.redisPassword = body.redisPassword;
        if (body.redisUrl !== undefined) data.redisUrl = body.redisUrl;

        // Marketing Ads fields
        if (body.marketingAdsEnabled !== undefined) data.marketingAdsEnabled = !!body.marketingAdsEnabled;
        if (body.selectedMarketingAds !== undefined) data.selectedMarketingAds = body.selectedMarketingAds;
        if (body.adDisplayMode !== undefined) data.adDisplayMode = body.adDisplayMode;
        if (body.quickInstallerEnabled !== undefined) data.quickInstallerEnabled = !!body.quickInstallerEnabled;
        if (body.marketingAdConfigs !== undefined) data.marketingAdConfigs = body.marketingAdConfigs;

        // Error Tracking fields
        if (body.errorTrackingEnabled !== undefined) data.errorTrackingEnabled = !!body.errorTrackingEnabled;
        if (body.sentryDsn !== undefined) data.sentryDsn = body.sentryDsn;
        if (body.sentryEnvironment !== undefined) data.sentryEnvironment = body.sentryEnvironment;
        if (body.sentryTracesSampleRate !== undefined) data.sentryTracesSampleRate = parseFloat(body.sentryTracesSampleRate);

        // Order Cancellation & Protection fields
        if (body.orderCancellationHours !== undefined) {
            const val = parseInt(body.orderCancellationHours);
            if (!isNaN(val)) data.orderCancellationHours = val;
        }
        if (body.orderCancellationEnabled !== undefined) data.orderCancellationEnabled = !!body.orderCancellationEnabled;
        if (body.protectionWindowDays !== undefined) {
            const val = parseInt(body.protectionWindowDays);
            if (!isNaN(val)) data.protectionWindowDays = val;
        }

        // Map Provider fields
        if (body.mapProvider !== undefined) data.mapProvider = body.mapProvider;
        if (body.enabledMapProviders !== undefined) data.enabledMapProviders = body.enabledMapProviders;
        if (body.googleMapsApiKey !== undefined) data.googleMapsApiKey = body.googleMapsApiKey;
        if (body.geoapifyApiKey !== undefined) data.geoapifyApiKey = body.geoapifyApiKey;
        if (body.radarApiKey !== undefined) data.radarApiKey = body.radarApiKey;

        // Email Provider fields
        if (body.emailProvider !== undefined) data.emailProvider = body.emailProvider;
        if (body.smtpHost !== undefined) data.smtpHost = body.smtpHost;
        if (body.smtpPort !== undefined) {
            const port = parseInt(body.smtpPort);
            if (!isNaN(port)) data.smtpPort = port;
        }
        if (body.smtpUser !== undefined) data.smtpUser = body.smtpUser;
        if (body.smtpPass !== undefined) data.smtpPass = body.smtpPass;
        if (body.smtpFrom !== undefined) data.smtpFrom = body.smtpFrom;
        if (body.brevoApiKey !== undefined) data.brevoApiKey = body.brevoApiKey;
        if (body.gmassApiKey !== undefined) data.gmassApiKey = body.gmassApiKey;

        // SMS Provider fields
        if (body.smsProvider !== undefined) data.smsProvider = body.smsProvider;
        if (body.zerixApiKey !== undefined) data.zerixApiKey = body.zerixApiKey;
        if (body.itextmoApiKey !== undefined) data.itextmoApiKey = body.itextmoApiKey;
        if (body.itextmoClientCode !== undefined) data.itextmoClientCode = body.itextmoClientCode;
        if (body.viberApiKey !== undefined) data.viberApiKey = body.viberApiKey;
        if (body.brevoSmsApiKey !== undefined) data.brevoSmsApiKey = body.brevoSmsApiKey;

        const updated = await updateSystemSettings(data);
        
        return NextResponse.json(updated);

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
