'use client';

/**
 * RealtimeProvider - Global realtime update orchestrator
 *
 * HOW THIS ADAPTIVE FIX WORKS:
 * 1. Fetches the configured poll interval from `/api/system/realtime`.
 * 2. Connects to the configured WebSocket provider (Pusher/Socket.io).
 * 3. ADAPTIVE HEARTBEAT:
 *    - If WebSocket is CONNECTED: Heartbeat is SLOW (60s) to save resources,
 *      acting only as a safety net.
 *    - If WebSocket is DISCONNECTED: Heartbeat is FAST (configured interval, default 10s)
 *      acting as the primary synchronization mechanism (SWR fallback).
 * 4. Each heartbeat/event triggers `router.refresh()` (Server Components) 
 *    and `realtime.broadcast()` (Client Components).
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { realtime } from '@/lib/realtime';

const DEFAULT_POLL_MS = 10000;

export default function RealtimeProvider() {
  const router = useRouter();
  const pathname = usePathname();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // (v43.2) Disable realtime bus entirely on login page to avoid flickering
  if (pathname === '/login') return null;
  const [wsConnected, setWsConnected] = useState(false);
  const configRef = useRef({ intervalMs: DEFAULT_POLL_MS });
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const triggerRefresh = (source = 'heartbeat') => {
      console.log(`[RealtimeProvider] Triggering refresh (Source: ${source}, WS: ${realtime.isWebSocketConnected() ? 'OK' : 'OFFLINE'})`);
      router.refresh();
      // Only broadcast if triggered by heartbeat to avoid infinite loops with internal events
      if (source === 'heartbeat') {
        realtime.broadcast({ source: 'heartbeat', ts: Date.now() });
      }
    };

    const updateTimer = (connected: boolean) => {
      setWsConnected(connected);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // (v43.3) ADAPTIVE HEARTBEAT RECOVERY
      // We restore polling but differentiate by connection state and route.
      // Rule: Login page NEVER polls (flicker prevention).
      if (pathname === '/login') {
        console.log('[RealtimeProvider] Login page detected. Polling suppressed.');
        return;
      }

      // If connected: 60s safety pulse. If disconnected: Fast sync (configured or 10s).
      const interval = connected ? 60000 : (configRef.current.intervalMs || DEFAULT_POLL_MS);
      
      console.log(`[RealtimeProvider] WS: ${connected ? 'OK' : 'OFFLINE'}. Setting heartbeat: ${interval}ms`);
      
      timerRef.current = setInterval(() => {
        triggerRefresh('heartbeat');
      }, interval);
    };

    const bootstrap = async () => {
      try {
        const res = await fetch('/api/system/realtime', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          configRef.current.intervalMs = data.swrPollingInterval || DEFAULT_POLL_MS;
        }
      } catch (err) {
        console.warn('[RealtimeProvider] Failed to fetch config, using defaults.');
      }

      // Initial start
      updateTimer(realtime.isWebSocketConnected());

      // Listen for ANY_UPDATE to trigger instant server-side refresh
      // This bridges the gap between WebSocket events and Server Components
      const unbindUpdate = realtime.on("ANY_UPDATE", (data) => {
        // If the update came from heartbeat, we already called refresh
        if (data?.source !== 'heartbeat') {
          console.log(`[RealtimeProvider] Instant refresh from event:`, data);
          router.refresh();
        }
      });

      // Listen for WebSocket status changes to adapt heartbeat on-the-fly
      realtime.onWebSocketStatusChange((connected) => {
        updateTimer(connected);
      });

      // Initialize the connection
      await realtime.init().catch(() => {});
      
      return unbindUpdate;
    };

    const cleanupPromise = bootstrap();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      cleanupPromise.then(unbind => unbind?.());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
