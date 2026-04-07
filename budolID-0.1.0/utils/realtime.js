/**
 * BudolID Real-time Trigger Utility
 * WHY: BudolID SSO needs to notify the ecosystem (websocket server) of SSO events
 *      (logins, registrations) in real-time for the Admin Dashboard audit trail.
 *      This file was missing from the repo, causing a startup crash on Vercel.
 * WHAT: Posts a trigger event to the internal WebSocket server via HTTP.
 *       Uses silent failure so auth flows are never blocked if WS is offline.
 * TODO: Replace raw fetch with a proper Pusher/Ably SDK if WebSocket server is migrated.
 */

async function triggerRealtimeEvent(channel, event, data) {
    // Determine the internal WebSocket/trigger server URL from environment
    // Falls back to localhost:4000 for local development
    let internalUrl = process.env.INTERNAL_WS_URL || 'http://localhost:4000';

    // Ensure we use http protocol for the trigger POST request (not ws://)
    const triggerUrl = internalUrl.replace('ws://', 'http://').replace(/\/$/, '') + '/trigger';

    try {
        console.log(`[BudolID-Realtime] Triggering activity [${event}] on [${channel}] via ${triggerUrl}`);

        // Use global fetch (Node 18+) — Vercel serverless runs Node 18+
        // AbortSignal.timeout provides a 3.5s timeout so auth is never blocked
        const response = await fetch(triggerUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channel, event, data }),
            signal: (typeof AbortSignal !== 'undefined' && AbortSignal.timeout)
                ? AbortSignal.timeout(3500)
                : null
        });

        if (response.ok) {
            return { success: true, mode: 'SOCKET_IO' };
        }

        console.warn(`[BudolID-Realtime] Trigger failed with status: ${response.status}`);
        return { success: false, status: response.status };

    } catch (err) {
        // Silent failure — auth must never be blocked by realtime events being down
        console.error(`[BudolID-Realtime] Execution Error: ${err.message}`);
        return { success: false, error: err.message };
    }
}

module.exports = { triggerRealtimeEvent };
