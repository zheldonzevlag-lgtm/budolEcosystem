import { prisma } from './prisma.js';

// Simple in-memory cache to reduce DB hits
let settingsCache = null;
let lastFetch = 0;
const CACHE_TTL = 60000; // 1 minute

export const DEFAULT_SETTINGS = {
    id: "default",
    realtimeProvider: "SOCKET_IO",
    pusherSecret: null,
    socketUrl: "https://budolws.duckdns.org",
    swrPollingInterval: 10000,
    sessionTimeout: 15,
    sessionWarning: 1,
    loginLimit: 10,
    registerLimit: 5,
    cacheProvider: "MEMORY",
    errorTrackingEnabled: false,
    sentryDsn: null,
    sentryEnvironment: "production",
    sentryTracesSampleRate: 0.1,
    marketingAdsEnabled: false,
    selectedMarketingAds: [],
    adDisplayMode: "SEQUENCE",
    quickInstallerEnabled: false,
    marketingAdConfigs: [],
    orderCancellationHours: 48,
    orderCancellationEnabled: true,
    protectionWindowDays: 3,
    budolShapShippingEnabled: false,
    budolShapShippingSLADays: 3,
    budolShapWaybillGeneration: false,
    mapProvider: "OSM",
    enabledMapProviders: ["OSM"],

    // Email Provider Defaults
    emailProvider: "GOOGLE",
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpUser: null,
    smtpPass: null,
    smtpFrom: null,
    brevoApiKey: null,
    gmassApiKey: null,

    // SMS Provider Defaults
    smsProvider: "CONSOLE",
    zerixApiKey: null,
    itextmoApiKey: null,
    itextmoClientCode: null,
    viberApiKey: null,
    brevoSmsApiKey: null
};

export function clearSettingsCache() {
    settingsCache = null;
    lastFetch = 0;
    console.log("[Settings] Cache cleared.");
}

export async function getSystemSettings(forceRefresh = false) {
    const now = Date.now();
    // Cache check
    if (!forceRefresh && settingsCache && (now - lastFetch < CACHE_TTL)) {
        return settingsCache;
    }

    try {
        let settings = await prisma.systemSettings.findUnique({
            where: { id: "default" }
        });

        if (!settings) {
            try {
                settings = await prisma.systemSettings.create({
                    data: DEFAULT_SETTINGS
                });
            } catch (createError) {
                // If another process created it in the meantime, just fetch it
                if (createError.code === 'P2002') {
                    settings = await prisma.systemSettings.findUnique({
                        where: { id: "default" }
                    });
                } else {
                    throw createError;
                }
            }
        }

        // Apply any overrides from environment variables if present
        // This allows developers to override DB settings for local testing
        if (process.env.OVERRIDE_EMAIL_PROVIDER) settings.emailProvider = process.env.OVERRIDE_EMAIL_PROVIDER;
        if (process.env.OVERRIDE_SMS_PROVIDER) settings.smsProvider = process.env.OVERRIDE_SMS_PROVIDER;

        // Backward compatibility for Map Provider (GOOGLE -> GOOGLE_MAPS)
        if (settings.mapProvider === 'GOOGLE') {
            settings.mapProvider = 'GOOGLE_MAPS';
        }
        if (settings.enabledMapProviders && Array.isArray(settings.enabledMapProviders)) {
            settings.enabledMapProviders = settings.enabledMapProviders.map(p => 
                p === 'GOOGLE' ? 'GOOGLE_MAPS' : p
            );
        }

        // Product Media Upload Limits (defaults if missing in schema)
        if (settings.maxProductImages === undefined || settings.maxProductImages === null) {
            settings.maxProductImages = process.env.MAX_PRODUCT_IMAGES ? parseInt(process.env.MAX_PRODUCT_IMAGES) : 12;
        }
        if (settings.maxProductVideos === undefined || settings.maxProductVideos === null) {
            settings.maxProductVideos = process.env.MAX_PRODUCT_VIDEOS ? parseInt(process.env.MAX_PRODUCT_VIDEOS) : 0;
        }

        // Fallback fetch for columns that may exist in DB but not yet in generated Prisma client
        try {
            const rows = await prisma.$queryRaw`SELECT "marketingAdConfigs" FROM "SystemSettings" WHERE "id" = 'default'`;
            if (Array.isArray(rows) && rows.length > 0 && rows[0]?.marketingAdConfigs !== undefined) {
                settings.marketingAdConfigs = rows[0].marketingAdConfigs || [];
            }
        } catch (_e) {
            // ignore
        }

        settingsCache = settings;
        lastFetch = now;
        return settings;
    } catch (error) {
        console.error("Failed to fetch system settings:", error);
        // Return default fallback if DB fails
        return { ...DEFAULT_SETTINGS };
    }
}

export async function updateSystemSettings(data) {
    try {
        // 1. Try to find the existing settings first
        const existing = await prisma.systemSettings.findUnique({
            where: { id: "default" }
        });

        let settings;
        if (existing) {
            // 2. If exists, perform update
            try {
                settings = await prisma.systemSettings.update({
                    where: { id: "default" },
                    data: data
                });
            } catch (e) {
                // Handle unknown argument errors for newly added JSON columns
                const message = String(e?.message || "");
                if (message.includes("Unknown argument `marketingAdConfigs`")) {
                    const { marketingAdConfigs, ...rest } = data;
                    // Update known fields
                    settings = await prisma.systemSettings.update({
                        where: { id: "default" },
                        data: rest
                    });
                    // Raw update for JSON column to bypass client schema lag
                    if (marketingAdConfigs !== undefined) {
                        try {
                            await prisma.$executeRaw`UPDATE "SystemSettings" SET "marketingAdConfigs" = ${JSON.stringify(marketingAdConfigs)} WHERE "id" = 'default'`;
                        } catch (rawErr) {
                            console.error("Raw update for marketingAdConfigs failed:", rawErr);
                            throw rawErr;
                        }
                    }
                    // Refetch to include raw-updated column
                    try {
                        const rows = await prisma.$queryRaw`SELECT "marketingAdConfigs" FROM "SystemSettings" WHERE "id" = 'default'`;
                        if (Array.isArray(rows) && rows.length > 0) {
                            settings.marketingAdConfigs = rows[0]?.marketingAdConfigs || [];
                        }
                    } catch (_e2) {}
                } else {
                    throw e;
                }
            }
        } else {
            // 3. If not exists, perform create with full defaults
            settings = await prisma.systemSettings.create({
                data: {
                    ...DEFAULT_SETTINGS,
                    ...data,
                    id: "default"
                }
            });
        }

        // Invalidate cache
        settingsCache = settings;
        lastFetch = Date.now();

        return settings;
    } catch (error) {
        console.error("❌ Failed to update system settings:", error);
        // Log more details about the data being passed
        console.error("Payload data:", JSON.stringify(data, null, 2));
        throw error;
    }
}
