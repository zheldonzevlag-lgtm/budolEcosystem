import { prisma } from "./prisma.js";
import Pusher from "pusher";

// Cache settings to avoid hammering DB
let settingsCache = null;
let lastFetch = 0;
let pusherInstance = null;
let lastPusherConfig = null;

/**
 * Clear the settings cache to force a fresh fetch from DB.
 * Useful when settings are updated via Admin UI.
 */
export function clearSettingsCache() {
    settingsCache = null;
    lastFetch = 0;
    pusherInstance = null;
    lastPusherConfig = null;
    console.log("[Realtime] Settings cache cleared.");
}

async function getSettings() {
    const now = Date.now();
    // Reduced cache to 10 seconds for better responsiveness
    if (settingsCache && (now - lastFetch < 10000)) {
        return settingsCache;
    }

    try {
        let settings = await prisma.systemSettings.findUnique({
            where: { id: "default" }
        });

        if (!settings) {
            try {
                settings = await prisma.systemSettings.create({
                    data: {
                        id: "default",
                        realtimeProvider: "POLLING"
                    }
                });
            } catch (createError) {
                if (createError.code === 'P2002') {
                    settings = await prisma.systemSettings.findUnique({
                        where: { id: "default" }
                    });
                } else {
                    throw createError;
                }
            }
        }

        settingsCache = settings;
        lastFetch = now;
        return settings;
    } catch (error) {
        console.error("[Realtime] Failed to fetch settings from DB, using fallback:", error.message);
        return {
            realtimeProvider: "POLLING",
            pusherKey: null,
            pusherCluster: null,
            pusherAppId: null,
            pusherSecret: null,
            socketUrl: null,
            swrPollingInterval: 10000
        };
    }
}

/**
 * Get or create a Pusher instance (Singleton)
 */
function getPusher(settings) {
    const configFingerprint = `${settings.pusherAppId}:${settings.pusherKey}:${settings.pusherCluster}`;

    if (pusherInstance && lastPusherConfig === configFingerprint) {
        return pusherInstance;
    }

    console.log("[Realtime] Initializing new Pusher server-side instance...");
    pusherInstance = new Pusher({
        appId: settings.pusherAppId,
        key: settings.pusherKey,
        secret: settings.pusherSecret,
        cluster: settings.pusherCluster,
        useTLS: true
    });
    lastPusherConfig = configFingerprint;
    return pusherInstance;
}

export async function triggerRealtimeEvent(channel, event, data) {
    try {
        const settings = await getSettings();
        let provider = settings.realtimeProvider;

        // Validation & Fallback Logic
        if (provider === 'PUSHER') {
            if (!settings.pusherAppId || !settings.pusherKey || !settings.pusherSecret || !settings.pusherCluster) {
                console.warn("[Realtime] Pusher configured but missing credentials. Falling back to POLLING.");
                provider = 'POLLING';
            }
        } else if (provider === 'SOCKET_IO') {
            if (!settings.socketUrl) {
                console.warn("[Realtime] Socket.io configured but missing URL. Falling back to POLLING.");
                provider = 'POLLING';
            }
        }

        // 1. POLLING MODE (Direct POLLING if configured or as a fallback)
        if (provider === 'POLLING' || provider === 'SWR') {
            return { success: true, mode: 'POLLING' };
        }

        // Multi-Layer Fallback Chain (Only active in Production)
        const isProduction = process.env.NODE_ENV === 'production';

        // 2. SOCKET_IO (Primary)
        if (provider === 'SOCKET_IO') {
            try {
                const internalUrl = process.env.INTERNAL_WS_URL || settings.socketUrl || 'http://localhost:4000';
                const triggerUrl = `${internalUrl}/trigger`;

                console.log(`[Realtime] Triggering Socket.io event [${event}] via ${triggerUrl}`);

                const response = await fetch(triggerUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ channel, event, data }),
                    signal: AbortSignal.timeout(3500) // 3.5s timeout for production fallback
                });

                if (response.ok) {
                    return { success: true, mode: 'SOCKET_IO' };
                }
                
                if (isProduction) {
                    console.warn(`[Realtime] Socket.io failed (${response.status}) in PROD. Falling back to Pusher...`);
                    provider = 'PUSHER'; // Move to next step in chain
                } else {
                    const errorText = await response.text();
                    throw new Error(`Socket.io trigger failed: ${response.status} ${errorText}`);
                }
            } catch (err) {
                if (isProduction) {
                    console.error(`[Realtime] Socket.io error in PROD: ${err.message}. Falling back to Pusher...`);
                    provider = 'PUSHER';
                } else {
                    throw err;
                }
            }
        }

        // 3. PUSHER (Secondary Fallback - Only if Socket.io failed in PROD)
        if (provider === 'PUSHER') {
            if (settings.pusherAppId && settings.pusherKey && settings.pusherSecret && settings.pusherCluster) {
                try {
                    const pusher = getPusher(settings);
                    await pusher.trigger(channel, event, data);
                    return { success: true, mode: isProduction ? 'PUSHER (Fallback)' : 'PUSHER' };
                } catch (pusherErr) {
                    console.error(`[Realtime] Pusher failed: ${pusherErr.message}`);
                }
            } else if (isProduction) {
                console.warn("[Realtime] Pusher fallback skipped (Missing credentials).");
            }
            // Final level in production fallback: Success but client will poll
            if (isProduction) {
                console.log("[Realtime] Final level fallback to POLLING for prod triggered event.");
                return { success: true, mode: 'POLLING (Final Fallback)' };
            }
        }

        return { success: false, error: 'Unknown provider or provider failed' };
    } catch (error) {
        console.error("[Realtime] Event trigger failed:", error.message);
        return { success: false, error: error.message };
    }
}

export async function getRealtimeConfig() {
    const settings = await getSettings();
    const localIp = process.env.LOCAL_IP;

    let socketUrl = settings.socketUrl || 'http://localhost:4000';

    // Make Socket.io URL network aware if it's localhost (for mobile testing)
    const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    let provider = settings.realtimeProvider || 'POLLING';

    if (socketUrl.includes('localhost') && localIp && isDevelopment) {
        socketUrl = socketUrl.replace('localhost', localIp);
        console.log(`[Realtime] Adjusted localhost to ${localIp} for network awareness (Development mode)`);
    } else if (socketUrl.includes('localhost') && !isDevelopment) {
        console.warn(`[Realtime] SocketUrl includes localhost in production! Falling back to POLLING.`);
        provider = 'POLLING';
    }

    // Return only necessary public config
    return {
        provider: provider,
        realtimeProvider: provider, // For compatibility
        pusherKey: settings.pusherKey,
        pusherCluster: settings.pusherCluster,
        socketUrl: socketUrl,
        swrPollingInterval: settings.swrPollingInterval || 10000
    };
}
