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

        // Also apply SMTP env var overrides from ECS task definition
        // WHY: When Prisma client is older and doesn't know about email columns in DB,
        //      the ECS task def env vars serve as the fallback SMTP source.
        if (process.env.SMTP_HOST) settings.smtpHost = process.env.SMTP_HOST;
        if (process.env.SMTP_USER) settings.smtpUser = process.env.SMTP_USER;
        if (process.env.SMTP_PASS) settings.smtpPass = process.env.SMTP_PASS;
        if (process.env.SMTP_FROM) settings.smtpFrom = process.env.SMTP_FROM;
        if (process.env.SMTP_PORT) settings.smtpPort = parseInt(process.env.SMTP_PORT) || 587;

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

        // Fallback fetch for columns that may exist in DB but not yet in generated Prisma client.
        // WHY: Prisma's $queryRaw can read any column regardless of client schema.
        try {
            const rows = await prisma.$queryRawUnsafe(
                `SELECT "marketingAdConfigs", "emailProvider", "smtpHost", "smtpPort",
                        "smtpUser", "smtpPass", "smtpFrom", "brevoApiKey", "gmassApiKey",
                        "smsProvider", "zerixApiKey", "itextmoApiKey", "itextmoClientCode",
                        "viberApiKey", "brevoSmsApiKey"
                 FROM "SystemSettings" WHERE "id" = 'default'`
            );
            if (Array.isArray(rows) && rows.length > 0) {
                const row = rows[0];
                // Only apply DB values if env vars haven't already overridden them
                if (row.marketingAdConfigs !== undefined) settings.marketingAdConfigs = row.marketingAdConfigs || [];
                if (row.emailProvider && !process.env.OVERRIDE_EMAIL_PROVIDER) settings.emailProvider = row.emailProvider;
                if (row.smtpHost && !process.env.SMTP_HOST) settings.smtpHost = row.smtpHost;
                if (row.smtpPort && !process.env.SMTP_PORT) settings.smtpPort = row.smtpPort;
                if (row.smtpUser && !process.env.SMTP_USER) settings.smtpUser = row.smtpUser;
                if (row.smtpPass && !process.env.SMTP_PASS) settings.smtpPass = row.smtpPass;
                if (row.smtpFrom && !process.env.SMTP_FROM) settings.smtpFrom = row.smtpFrom;
                if (row.brevoApiKey !== undefined) settings.brevoApiKey = row.brevoApiKey;
                if (row.gmassApiKey !== undefined) settings.gmassApiKey = row.gmassApiKey;
                if (row.smsProvider && !process.env.OVERRIDE_SMS_PROVIDER) settings.smsProvider = row.smsProvider;
                if (row.zerixApiKey !== undefined) settings.zerixApiKey = row.zerixApiKey;
                if (row.itextmoApiKey !== undefined) settings.itextmoApiKey = row.itextmoApiKey;
                if (row.itextmoClientCode !== undefined) settings.itextmoClientCode = row.itextmoClientCode;
                if (row.viberApiKey !== undefined) settings.viberApiKey = row.viberApiKey;
                if (row.brevoSmsApiKey !== undefined) settings.brevoSmsApiKey = row.brevoSmsApiKey;
            }
        } catch (_e) {
            // Some columns may not exist yet — just skip, env var fallbacks still apply
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

/**
 * updateSystemSettings
 * WHY: The Prisma client is generated at Docker build time. If new columns were added to
 *      the DB (email/SMS fields, marketingAdConfigs) after the image was built, Prisma
 *      throws "Unknown argument" errors. We pre-split those fields and handle them via
 *      $executeRawUnsafe so the Admin UI never crashes, regardless of schema sync.
 */
export async function updateSystemSettings(data) {
    try {
        // Fields added to DB after the deployed Prisma client was generated.
        // These must go through raw SQL — Prisma does not know about them.
        const RAW_ONLY_FIELDS = [
            'emailProvider', 'smtpHost', 'smtpPort', 'smtpUser', 'smtpPass',
            'smtpFrom', 'brevoApiKey', 'gmassApiKey',
            'smsProvider', 'zerixApiKey', 'itextmoApiKey', 'itextmoClientCode',
            'viberApiKey', 'brevoSmsApiKey', 'marketingAdConfigs',
        ];

        // Split payload: known Prisma fields vs raw SQL fields
        const rawData = {};
        const prismaData = {};
        for (const [key, value] of Object.entries(data)) {
            if (RAW_ONLY_FIELDS.includes(key)) {
                rawData[key] = value;
            } else {
                prismaData[key] = value;
            }
        }

        // 1. Find or create the settings record
        const existing = await prisma.systemSettings.findUnique({
            where: { id: "default" }
        });

        let settings;
        if (existing) {
            // 2a. Update known Prisma fields
            if (Object.keys(prismaData).length > 0) {
                settings = await prisma.systemSettings.update({
                    where: { id: "default" },
                    data: prismaData
                });
            } else {
                settings = existing;
            }

            // 2b. Update raw SQL fields individually
            // Each field is updated separately so one failure doesn't block others.
            for (const [col, val] of Object.entries(rawData)) {
                try {
                    if (col === 'marketingAdConfigs') {
                        // JSON column — serialize before sending
                        await prisma.$executeRaw`UPDATE "SystemSettings" SET "marketingAdConfigs" = ${JSON.stringify(val)} WHERE "id" = 'default'`;
                    } else if (col === 'smtpPort') {
                        const portNum = parseInt(val) || 587;
                        await prisma.$executeRawUnsafe(
                            `UPDATE "SystemSettings" SET "smtpPort" = $1 WHERE "id" = 'default'`,
                            portNum
                        );
                    } else if (val === null || val === undefined) {
                        await prisma.$executeRawUnsafe(
                            `UPDATE "SystemSettings" SET "${col}" = NULL WHERE "id" = 'default'`
                        );
                    } else {
                        await prisma.$executeRawUnsafe(
                            `UPDATE "SystemSettings" SET "${col}" = $1 WHERE "id" = 'default'`,
                            String(val)
                        );
                    }
                    if (settings) settings[col] = val;
                } catch (rawErr) {
                    // Column doesn't exist in DB yet — auto-add it then retry
                    console.warn(`[Settings] Column "${col}" missing, attempting ALTER TABLE...`);
                    try {
                        const colType = col === 'smtpPort' ? 'INTEGER DEFAULT 587' : 'TEXT';
                        await prisma.$executeRawUnsafe(
                            `ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "${col}" ${colType}`
                        );
                        // Retry after adding column
                        if (col === 'smtpPort') {
                            const portNum = parseInt(val) || 587;
                            await prisma.$executeRawUnsafe(
                                `UPDATE "SystemSettings" SET "smtpPort" = $1 WHERE "id" = 'default'`,
                                portNum
                            );
                        } else if (val !== null && val !== undefined) {
                            await prisma.$executeRawUnsafe(
                                `UPDATE "SystemSettings" SET "${col}" = $1 WHERE "id" = 'default'`,
                                String(val)
                            );
                        }
                        if (settings) settings[col] = val;
                        console.log(`[Settings] Column "${col}" added and updated successfully.`);
                    } catch (alterErr) {
                        console.error(`[Settings] Could not add/update column "${col}":`, alterErr?.message);
                    }
                }
            }

            // 2c. Re-read raw fields back from DB to keep cache accurate
            if (Object.keys(rawData).length > 0) {
                try {
                    const colList = Object.keys(rawData).map(c => `"${c}"`).join(', ');
                    const rows = await prisma.$queryRawUnsafe(
                        `SELECT ${colList} FROM "SystemSettings" WHERE "id" = 'default'`
                    );
                    if (Array.isArray(rows) && rows.length > 0 && settings) {
                        Object.assign(settings, rows[0]);
                    }
                } catch (_e2) { /* non-fatal — cache refreshes on next read */ }
            }

        } else {
            // 3. First-time create — Prisma only, raw fields added separately after
            const safeDefaults = Object.fromEntries(
                Object.entries({ ...DEFAULT_SETTINGS, ...prismaData })
                    .filter(([k]) => !RAW_ONLY_FIELDS.includes(k))
            );
            settings = await prisma.systemSettings.create({
                data: { ...safeDefaults, id: "default" }
            });
        }

        // Invalidate settings cache
        settingsCache = settings;
        lastFetch = Date.now();

        return settings;
    } catch (error) {
        console.error("❌ Failed to update system settings:", error);
        console.error("Payload data:", JSON.stringify(data, null, 2));
        throw error;
    }
}
