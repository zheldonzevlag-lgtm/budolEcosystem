'use client';

/**
 * RealtimeProvider - Global realtime update orchestrator
 *
 * WHY THIS EXISTS:
 * The Admin Dashboard contains both Server Components (Home dashboard, Accounting)
 * and Client Components (Users, Transactions, Employees, Security, Disputes).
 * Both need fresh data without a manual page reload.
 *
 * ROOT CAUSE OF PREVIOUS FAILURE:
 * Pusher/Socket.io are configured as the realtime provider, but no backend
 * code currently publishes events to Pusher. This means the WebSocket
 * connection stays idle and pages never update automatically.
 *
 * HOW THIS FIX WORKS:
 * 1. Fetches the configured poll interval from `/api/system/realtime`.
 * 2. Runs a GUARANTEED polling timer on that interval, regardless of provider.
 * 3. Each tick calls router.refresh() (Server Components) AND realtime.broadcast()
 *    (Client Components that subscribed to ANY_UPDATE).
 * 4. If Pusher/Socket.io delivers an event first, that triggers an instant update.
 *    The periodic poll is then the reliable safety net.
 *
 * TODO: Add Pusher.trigger() calls in API routes (e.g. after transaction creation,
 *       user verification) to achieve true instant push updates.
 */

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { realtime } from '@/lib/realtime';

const FALLBACK_POLL_MS = 10000; // 10 seconds default

export default function RealtimeProvider() {
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const triggerRefresh = () => {
      // Refresh Server Component data (home dashboard, accounting pages)
      router.refresh();
      // Notify all Client Component pages that subscribed to ANY_UPDATE
      // (users, transactions, employees, security, disputes call their own fetchData)
      realtime.broadcast({ source: 'heartbeat', ts: Date.now() });
    };

    const start = async () => {
      let intervalMs = FALLBACK_POLL_MS;
      try {
        const res = await fetch('/api/system/realtime');
        if (res.ok) {
          const data = await res.json();
          intervalMs = data.swrPollingInterval || FALLBACK_POLL_MS;
          console.log(`[RealtimeProvider] Heartbeat configured: ${intervalMs}ms (provider: ${data.provider})`);
          // Also init the WebSocket connection (Pusher/Socket.io) for instant updates
          // These will call broadcast() themselves when events arrive.
          realtime.init().catch(() => {});
        }
      } catch {
        console.warn('[RealtimeProvider] Could not load realtime config, using default.');
      }

      // Start the guaranteed polling heartbeat
      timerRef.current = setInterval(triggerRefresh, intervalMs);
      console.log(`[RealtimeProvider] Polling heartbeat started (${intervalMs}ms).`);
    };

    start();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
