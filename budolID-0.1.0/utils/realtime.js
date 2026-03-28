/**
 * BudolID Real-time Trigger Utility
 * Used to notify the ecosystem of SSO events via WebSockets.
 */

async function triggerRealtimeEvent(channel, event, data) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Configuration from .env
    let internalUrl = process.env.INTERNAL_WS_URL || 'http://localhost:4000';
    
    // Ensure we use http protocol for the trigger POST request
    const triggerUrl = internalUrl.replace('ws://', 'http://').replace(/\/$/, '') + '/trigger';

    try {
        console.log(`[BudolID-Realtime] Triggering activity [${event}] on [${channel}] via ${triggerUrl}`);
        
        // Use global fetch (Node 18+)
        const response = await fetch(triggerUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channel, event, data }),
            // Use AbortSignal.timeout if available, or just a simple timeout
            signal: (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) ? AbortSignal.timeout(3500) : null
        });

        if (response.ok) {
            return { success: true, mode: 'SOCKET_IO' };
        }
        
        console.warn(`[BudolID-Realtime] Trigger failed with status: ${response.status}`);
        return { success: false, status: response.status };
    } catch (err) {
        // Silent failure to avoid blocking authentication flows
        console.error(`[BudolID-Realtime] Execution Error: ${err.message}`);
        return { success: false, error: err.message };
    }
}

module.exports = { triggerRealtimeEvent };
