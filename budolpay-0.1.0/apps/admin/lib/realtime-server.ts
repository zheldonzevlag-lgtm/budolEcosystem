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
  if (settingsCache && (now - lastFetch < 10000)) {
    return settingsCache;
  }

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
    let provider = settings['REALTIME_METHOD'] || 'SWR';
    const isProduction = process.env.NODE_ENV === 'production';

    console.log(`[Realtime-Server] Triggering event ${event} on channel ${channel} using ${provider}`);

    // 1. SOCKETIO Block with Production Fallback
    if (provider === 'SOCKETIO') {
      try {
        // Prioritize internal VPC URL for server-side triggers
        let socketUrl = process.env.INTERNAL_WS_URL || settings['REALTIME_SOCKETIO_URL'] || 'http://localhost:4000';
        const localIp = process.env.LOCAL_IP;

        if (socketUrl.includes('localhost') && localIp && !isProduction) {
          socketUrl = socketUrl.replace('localhost', localIp);
        }

        const triggerUrl = `${socketUrl}/trigger`;
        console.log(`[Realtime-Server] Sending trigger to ${triggerUrl}`);

        const response = await fetch(triggerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel, event, data }),
          signal: AbortSignal.timeout(3500) // Fast fallback for potentially sleeping Render service
        });

        if (response.ok) {
          return { success: true, mode: 'SOCKETIO' };
        }

        if (isProduction) {
          console.warn(`[Realtime-Server] Socket.io failed (${response.status}) in PROD. Falling back to PUSHER...`);
          provider = 'PUSHER';
        } else {
          const errorText = await response.text();
          throw new Error(`Socket.io trigger failed: ${response.status} ${errorText}`);
        }
      } catch (err: any) {
        if (isProduction) {
          console.error(`[Realtime-Server] Socket.io error in PROD: ${err.message}. Falling back to PUSHER...`);
          provider = 'PUSHER';
        } else {
          throw err;
        }
      }
    }

    // 2. PUSHER Block (Secondary or Direct)
    if (provider === 'PUSHER') {
      const pusher = getPusher(settings);
      if (pusher) {
        try {
          await pusher.trigger(channel, event, data);
          return { success: true, mode: isProduction ? 'PUSHER (Fallback)' : 'PUSHER' };
        } catch (pusherErr: any) {
          console.error(`[Realtime-Server] Pusher trigger failed: ${pusherErr.message}`);
          if (isProduction) provider = 'SWR';
          else throw pusherErr;
        }
      } else {
        console.warn("[Realtime-Server] Pusher credentials missing.");
        if (isProduction) provider = 'SWR';
      }
    }

    // 3. SWR/POLLING Block (Tertiary Fallback)
    if (provider === 'SWR' || provider === 'POLLING') {
      return { success: true, mode: 'SWR' };
    }

    return { success: false, error: 'Unknown provider' };
  } catch (error: any) {
    console.error("[Realtime-Server] Event trigger failed:", error.message);
    return { success: false, error: error.message };
  }
}
