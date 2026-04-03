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
import { useRouter } from 'next/navigation';
import { realtime } from '@/lib/realtime';

const DEFAULT_POLL_MS = 10000;
const SLOW_POLL_MS = 60000; // 1 minute safety net when WS is healthy

export default function RealtimeProvider() {
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const configRef = useRef({ intervalMs: DEFAULT_POLL_MS });
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const triggerRefresh = () => {
      console.log(`[RealtimeProvider] Triggering refresh (WS: ${realtime.isWebSocketConnected() ? 'OK' : 'OFFLINE'})`);
      router.refresh();
      realtime.broadcast({ source: 'heartbeat', ts: Date.now() });
    };

    const updateTimer = (connected: boolean) => {
      setWsConnected(connected);
      if (timerRef.current) clearInterval(timerRef.current);
      
      const newInterval = connected ? SLOW_POLL_MS : configRef.current.intervalMs;
      timerRef.current = setInterval(triggerRefresh, newInterval);
      console.log(`[RealtimeProvider] Heartbeat adapted to ${newInterval}ms (WS is ${connected ? 'CONNECTED' : 'DISCONNECTED'})`);
    };

    const bootstrap = async () => {
      try {
        const res = await fetch('/api/system/realtime');
        if (res.ok) {
          const data = await res.json();
          configRef.current.intervalMs = data.swrPollingInterval || DEFAULT_POLL_MS;
        }
      } catch (err) {
        console.warn('[RealtimeProvider] Failed to fetch config, using defaults.');
      }

      // Initial start
      updateTimer(realtime.isWebSocketConnected());

      // Listen for WebSocket status changes to adapt heartbeat on-the-fly
      realtime.onWebSocketStatusChange((connected) => {
        updateTimer(connected);
      });

      // Initialize the connection
      realtime.init().catch(() => {});
    };

    bootstrap();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
