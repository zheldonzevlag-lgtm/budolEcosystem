import { useEffect, useState } from 'react';
import useSWR from 'swr';
import Pusher from 'pusher-js';
import { io } from 'socket.io-client';

const fetcher = url => fetch(url).then(r => r.json());

/**
 * Generic Provider-Agnostic Realtime Hook
 * @param {Object} options
 * @param {string} options.channel - The channel name to subscribe to
 * @param {string} options.event - The event name to listen for
 * @param {Function} options.onData - Callback when data is received
 * @param {boolean} options.enabled - Whether realtime is enabled
 * @param {number} options.pollingInterval - Manual override for SWR polling interval in ms
 */
export function useRealtime({ channel, event, onData, enabled = true, pollingInterval }) {
    const [provider, setProvider] = useState('POLLING');
    const [isConnected, setIsConnected] = useState(false);
    
    // 1. Fetch System Realtime Config
    const { data: config } = useSWR(enabled ? '/api/system/realtime' : null, fetcher, {
        revalidateOnFocus: true,
        dedupingInterval: 5000
    });

    // Determine the effective polling interval
    const effectivePollingInterval = pollingInterval || config?.swrPollingInterval || 10000;

    // Handle provider state and fallback logic
    useEffect(() => {
        if (!config) return;

        let activeProvider = config.provider || 'POLLING';

        // Validation for Pusher
        if (activeProvider === 'PUSHER' && (!config.pusherKey || !config.pusherCluster)) {
            console.warn("[Realtime] Pusher configured but missing credentials. Falling back to POLLING.");
            activeProvider = 'POLLING';
        }

        // Validation for Socket.io
        if (activeProvider === 'SOCKET_IO' && !config.socketUrl) {
            console.warn("[Realtime] Socket.io configured but missing URL. Falling back to POLLING.");
            activeProvider = 'POLLING';
        }

        // Only update if provider actually changed to prevent re-render loops
        setProvider(prev => {
            if (prev !== activeProvider) {
                console.log(`[Realtime] Switching provider from ${prev} to ${activeProvider}`);
                return activeProvider;
            }
            return prev;
        });
    }, [config]);

    // 2. Pusher Integration
    useEffect(() => {
        if (!enabled || provider !== 'PUSHER' || !config?.pusherKey) return;

        let pusher;
        let pusherChannel;
        let isMounted = true;

        try {
            pusher = new Pusher(config.pusherKey, {
                cluster: config.pusherCluster,
            });

            pusher.connection.bind('connected', () => {
                if (isMounted) {
                    console.log("[Realtime] Pusher connected");
                    setIsConnected(true);
                }
            });
            pusher.connection.bind('disconnected', () => {
                if (isMounted) {
                    console.log("[Realtime] Pusher disconnected");
                    setIsConnected(false);
                }
            });
            pusher.connection.bind('error', (err) => {
                if (!isMounted) return;
                console.error("[Realtime] Pusher Connection Error:", err);
                // Only fallback on critical errors, not transient ones
                if (err.error && err.error.data && err.error.data.code === 4001) {
                    setProvider('POLLING'); // Authentication error
                }
            });

            pusherChannel = pusher.subscribe(channel);
            pusherChannel.bind(event, (data) => {
                if (onData && isMounted) onData(data);
            });
        } catch (err) {
            console.error("[Realtime] Failed to initialize Pusher:", err);
            if (isMounted) {
                setTimeout(() => setProvider('POLLING'), 0);
            }
        }

        return () => {
            isMounted = false;
            if (pusherChannel) pusherChannel.unbind_all();
            if (pusher) {
                pusher.unsubscribe(channel);
                pusher.disconnect();
            }
        };
    }, [enabled, provider, config?.pusherKey, config?.pusherCluster, channel, event]);

    // 3. Socket.io Integration
    useEffect(() => {
        if (!enabled || provider !== 'SOCKET_IO' || !config?.socketUrl) return;

        let socket;
        let isMounted = true;

        try {
            socket = io(config.socketUrl, {
                reconnectionAttempts: 3,
                timeout: 5000,
                // Prevent rapid reconnection loops
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000
            });

            // Track connection state to prevent loops
            let hasConnected = false;

            socket.on('connect', () => {
                if (isMounted) {
                    console.log("[Realtime] Socket.io connected to", config.socketUrl);
                    hasConnected = true;
                    setIsConnected(true);
                }
            });

            socket.on('disconnect', () => {
                if (isMounted) {
                    console.log("[Realtime] Socket.io disconnected");
                    setIsConnected(false);
                }
            });

            socket.on('connect_error', (err) => {
                if (!isMounted) return;
                console.error("[Realtime] Socket.io Connection Error:", err.message);
                // Only fallback to POLLING after all reconnection attempts fail
                // Don't fallback immediately on first error to avoid reconnection loops
            });

            socket.on('reconnect_failed', () => {
                if (!isMounted) return;
                console.warn("[Realtime] Socket.io reconnection failed, falling back to POLLING");
                setProvider('POLLING');
            });

            socket.on(event, (data) => {
                if (onData && isMounted) onData(data);
            });
            
            // If the server requires explicit subscription
            socket.emit('subscribe', channel);
        } catch (err) {
            console.error("[Realtime] Failed to initialize Socket.io:", err);
            if (isMounted) {
                setTimeout(() => setProvider('POLLING'), 0);
            }
        }

        return () => {
            isMounted = false;
            if (socket) {
                console.log("[Realtime] Cleaning up Socket.io connection");
                socket.disconnect();
            }
        };
    }, [enabled, provider, config?.socketUrl, channel, event]);

    // 4. SWR Polling Fallback (Always active if provider is POLLING)
    // We don't use useSWR here directly for data because this is a generic listener.
    // However, the consumer of this hook might want to know if they should poll.
    
    return {
        provider,
        isConnected: provider === 'POLLING' ? true : isConnected,
        config,
        isPolling: provider === 'POLLING',
        pollingInterval: effectivePollingInterval
    };
}
