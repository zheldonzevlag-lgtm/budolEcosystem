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
    const provider = settings['REALTIME_METHOD'] || 'SWR';

    console.log(`[Realtime-Server] Triggering event ${event} on channel ${channel} using ${provider}`);

    if (provider === 'PUSHER') {
      const pusher = getPusher(settings);
      if (pusher) {
        await pusher.trigger(channel, event, data);
        return { success: true, mode: 'PUSHER' };
      } else {
        console.warn("[Realtime-Server] Pusher credentials missing. Falling back to SWR (no-op).");
      }
    }

    if (provider === 'SOCKETIO') {
      let socketUrl = settings['REALTIME_SOCKETIO_URL'] || 'http://localhost:4000';
      const localIp = process.env.LOCAL_IP;

      if (socketUrl.includes('localhost') && localIp) {
        socketUrl = socketUrl.replace('localhost', localIp);
      }

      const triggerUrl = `${socketUrl}/trigger`;

      await fetch(triggerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel,
          event,
          data
        })
      });
      return { success: true, mode: 'SOCKETIO' };
    }

    // SWR/POLLING mode doesn't need explicit trigger, clients will poll
    if (provider === 'SWR') {
      return { success: true, mode: 'SWR' };
    }

    return { success: false, error: 'Unknown provider' };
  } catch (error: any) {
    console.error("[Realtime-Server] Event trigger failed:", error.message);
    return { success: false, error: error.message };
  }
}
