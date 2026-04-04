import { prisma } from "./prisma";
import Pusher from "pusher";

// Cache settings to avoid hammering DB
let settingsCache: Record<string, string> | null = null;
let lastFetch = 0;
let pusherInstance: Pusher | null = null;
let lastPusherConfig: string | null = null;

/**
 * Clear the settings cache to force a fresh fetch from DB.
 */
export function clearSettingsCache() {
  settingsCache = null;
  lastFetch = 0;
  pusherInstance = null;
  lastPusherConfig = null;
  console.log("[Realtime-Server] Settings cache cleared.");
}

async function getSettings() {
  const now = Date.now();
  // Use cached settings if fresh (10s TTL)
  if (settingsCache && (now - lastFetch < 10000)) {
    return settingsCache;
  }

  // v43.4: FAST PATH — read directly from env vars on cold starts.
  // WHY: In Vercel serverless, the in-memory cache resets on every new invocation.
  // A DB round-trip here adds ~100-200ms to every realtime push.
  // Env vars are set at deploy time and always available without network calls.
  const envFallback: Record<string, string> = {};
  if (process.env.PUSHER_APP_ID) envFallback['REALTIME_PUSHER_APP_ID'] = process.env.PUSHER_APP_ID;
  if (process.env.PUSHER_KEY) envFallback['REALTIME_PUSHER_KEY'] = process.env.PUSHER_KEY;
  if (process.env.PUSHER_SECRET) envFallback['REALTIME_PUSHER_SECRET'] = process.env.PUSHER_SECRET;
  if (process.env.PUSHER_CLUSTER) envFallback['REALTIME_PUSHER_CLUSTER'] = process.env.PUSHER_CLUSTER;
  if (process.env.REALTIME_METHOD) envFallback['REALTIME_METHOD'] = process.env.REALTIME_METHOD;

  // If we have the critical Pusher env vars, skip the DB query entirely
  if (envFallback['REALTIME_PUSHER_APP_ID'] && envFallback['REALTIME_PUSHER_KEY']) {
    console.log("[Realtime-Server] Using env-var fast path (no DB query needed).");
    settingsCache = envFallback;
    lastFetch = now;
    return envFallback;
  }

  // Fallback: fetch from DB (used when env vars are not set)
  try {
    const allSettings = await prisma.systemSetting.findMany({
      where: {
        group: 'REALTIME'
      }
    });

    const settingsMap = allSettings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    settingsCache = settingsMap;
    lastFetch = now;
    return settingsMap;
  } catch (error: any) {
    console.error("[Realtime-Server] Failed to fetch settings from DB:", error.message);
    return {};
  }
}

/**
 * Get or create a Pusher instance (Singleton)
 */
function getPusher(settings: Record<string, string>) {
  const appId = settings['REALTIME_PUSHER_APP_ID'];
  const key = settings['REALTIME_PUSHER_KEY'];
  const secret = settings['REALTIME_PUSHER_SECRET'];
  const cluster = settings['REALTIME_PUSHER_CLUSTER'] || 'ap1';

  const configFingerprint = `${appId}:${key}:${cluster}`;

  if (pusherInstance && lastPusherConfig === configFingerprint) {
    return pusherInstance;
  }

  if (!appId || !key || !secret) {
    return null;
  }

  console.log("[Realtime-Server] Initializing new Pusher server-side instance...");
  pusherInstance = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true
  });
  lastPusherConfig = configFingerprint;
  return pusherInstance;
}

export async function triggerRealtimeEvent(channel: string, event: string, data: any) {
  try {
    const settings = await getSettings();
    let provider = settings['REALTIME_METHOD'] || 'PUSHER'; // Default to PUSHER for v43.3
    const isProduction = process.env.NODE_ENV === 'production';

    // v43.3: In production, we MUST push because polling has been disabled in the client.
    if (isProduction && (provider === 'SWR' || provider === 'POLLING')) {
        console.log(`[Realtime-Server] Client polling is disabled in v43.2. Forcing PUSHER for production event: ${event}`);
        provider = 'PUSHER';
    }

    console.log(`[Realtime-Server] Triggering event ${event} on channel ${channel} using ${provider}`);

    // 1. SOCKETIO Block with Production Fallback
    if (provider === 'SOCKETIO') {
        try {
            // Prioritize internal VPC URL for server-side triggers
            let socketUrl = process.env.INTERNAL_WS_URL || settings['REALTIME_SOCKETIO_URL'];
            
            if (!socketUrl) {
                if (isProduction) {
                    console.warn("[Realtime-Server] No Socket.io URL in PROD. Falling back to PUSHER...");
                    provider = 'PUSHER';
                } else {
                    socketUrl = 'http://localhost:4000';
                }
            }

            if (socketUrl && provider === 'SOCKETIO') {
                const triggerUrl = `${socketUrl}/trigger`;
                // ... logic to call fetch ...
            }
        } catch (e) {}
    }
    
    // 2. PUSHER Block (Secondary or Direct)
    if (provider === 'PUSHER' || (isProduction && !pusherInstance)) {
        const pusher = getPusher(settings);
        if (pusher) {
            try {
                await pusher.trigger(channel, event, data);
                console.log(`[Realtime-Server] Event ${event} pushed successfully to ${channel}`);
                return { success: true, mode: 'PUSHER' };
            } catch (pusherErr: any) {
                console.error(`[Realtime-Server] Pusher trigger failed: ${pusherErr.message}`);
                // If Pusher fails in prod and it's our last hope, return error
                return { success: false, error: pusherErr.message };
            }
        }
    }

    // 3. SWR/POLLING Block (Tertiary Fallback)
    if (provider === 'SWR' || provider === 'POLLING') {
        return { success: true, mode: 'SWR (Silent)' };
    }

    return { success: false, error: 'Unknown provider' };
  } catch (error: any) {
    console.error("[Realtime-Server] Event trigger failed:", error.message);
    return { success: false, error: error.message };
  }
}
