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

        // 1. POLLING MODE (Default/Fallback)
        if (provider === 'POLLING') {
            return { success: true, mode: 'POLLING' };
        }

        // 2. PUSHER MODE
        if (provider === 'PUSHER') {
            const pusher = getPusher(settings);
            await pusher.trigger(channel, event, data);
            return { success: true, mode: 'PUSHER' };
        }

        // 3. SOCKET_IO MODE
        if (provider === 'SOCKET_IO') {
            // Internal notification via api-gateway or dedicated socket server
            const gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:8080';
            
            // Format payload to match Gateway expectations:
            // Gateway expects: { userId, event, data, isAdmin }
            // For admin channel broadcasts, we must set isAdmin: true
            
            const payload = {
                event,
                data,
                isAdmin: channel === 'admin'
            };

            // If it's a user channel (e.g., 'user-123'), extract userId
            if (channel.startsWith('user-')) {
                payload.userId = channel.replace('user-', '');
                payload.isAdmin = false;
            }

            await fetch(`${gatewayUrl}/internal/notify`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-internal-key': process.env.BUDOLPAY_API_KEY || 'bs_key_2025'
                },
                body: JSON.stringify(payload)
            });
            return { success: true, mode: 'SOCKET_IO' };
        }

        return { success: false, error: 'Unknown provider' };
    } catch (error) {
        console.error("[Realtime] Event trigger failed:", error.message);
        return { success: false, error: error.message };
    }
}

export async function getRealtimeConfig() {
    const settings = await getSettings();
    // Return only necessary public config
    return {
        provider: settings.realtimeProvider || 'POLLING',
        realtimeProvider: settings.realtimeProvider || 'POLLING', // For compatibility
        pusherKey: settings.pusherKey,
        pusherCluster: settings.pusherCluster,
        socketUrl: settings.socketUrl,
        swrPollingInterval: settings.swrPollingInterval || 10000
    };
}
