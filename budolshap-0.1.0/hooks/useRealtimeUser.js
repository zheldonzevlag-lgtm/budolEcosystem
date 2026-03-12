import useSWR from 'swr';
import { useEffect, useRef, useCallback } from 'react';
import Pusher from 'pusher-js';
import { io } from 'socket.io-client';

const fetcher = url => fetch(url).then(r => r.json());

export function useRealtimeUser({ userId, onEvent }) {
    // Use ref to stable reference the callback
    const onEventRef = useRef(onEvent);
    onEventRef.current = onEvent;
    
    // Use callback for stable event dispatching
    const dispatchEvent = useCallback((eventName, data) => {
        if (onEventRef.current) {
            onEventRef.current(eventName, data);
        }
    }, []);

    // 1. Fetch System Realtime Config
    const { data: config } = useSWR('/api/system/realtime', fetcher, {
        revalidateOnFocus: true,
        dedupingInterval: 5000 // Cache for 5s
    });

    const isPolling = config?.provider === 'POLLING';
    const isPusher = config?.provider === 'PUSHER';
    const isSocket = config?.provider === 'SOCKET_IO';

    // 2. Pusher Subscription
    useEffect(() => {
        if (!isPusher || !userId || !config?.pusherKey) return;

        let isMounted = true;
        const pusher = new Pusher(config.pusherKey, {
            cluster: config.pusherCluster,
        });

        const channelName = `user-${userId}`;
        const channel = pusher.subscribe(channelName);

        // Common user events
        const userEvents = ['store-status-updated', 'order-updated', 'rating-created', 'cart-updated'];

        // Bind each event
        userEvents.forEach(eventName => {
            channel.bind(eventName, (data) => {
                if (!isMounted) return;
                console.log(`⚡ [RealtimeUser] ${eventName} (Pusher):`, data);
                dispatchEvent(eventName, data);
            });
        });

        return () => {
            isMounted = false;
            // Unbind all events from this channel
            if (channel.unbind_all) {
                channel.unbind_all();
            }
            channel.unsubscribe();
            pusher.disconnect();
        };
    }, [isPusher, userId, config?.pusherKey, config?.pusherCluster, dispatchEvent]);

    // 3. Socket.io Subscription
    useEffect(() => {
        if (!isSocket || !userId || !config?.socketUrl) return;

        let isMounted = true;
        const socket = io(config.socketUrl, {
            reconnectionAttempts: 3,
            timeout: 5000,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000
        });

        socket.on('connect', () => {
            if (!isMounted) return;
            console.log("[RealtimeUser] Socket.io connected");
            socket.emit('subscribe', `user-${userId}`);
        });

        socket.on('disconnect', () => {
            if (!isMounted) return;
            console.log("[RealtimeUser] Socket.io disconnected");
        });

        socket.on('connect_error', (err) => {
            if (!isMounted) return;
            console.error("[RealtimeUser] Socket.io Connection Error:", err.message);
        });

        // Socket.io doesn't have a direct "bind_all" like Pusher, 
        // but we can listen for specific known events or use a catch-all if the server supports it.
        // For now, let's list common user events.
        const userEvents = ['store-status-updated', 'order-updated', 'rating-created', 'cart-updated'];
        
        userEvents.forEach(eventName => {
            socket.on(eventName, (data) => {
                if (!isMounted) return;
                console.log(`⚡ [RealtimeUser] ${eventName} (Socket):`, data);
                dispatchEvent(eventName, data);
            });
        });

        return () => {
            isMounted = false;
            socket.disconnect();
        };
    }, [isSocket, userId, config?.socketUrl, dispatchEvent]);

    // 4. Polling Fallback for POLLING mode
    useEffect(() => {
        if (!isPolling || !userId) return;

        // For POLLING mode, we don't have a specific "events" API yet,
        // but we can trigger a generic "cart-updated" check periodically
        // to ensure frontend stays in sync with backend cleanup.
        const interval = setInterval(() => {
            console.log('🔄 [RealtimeUser] Polling heartbeat (POLLING mode)');
            dispatchEvent('cart-updated', { reason: 'polling_fallback' });
        }, config?.swrPollingInterval || 15000);

        return () => clearInterval(interval);
    }, [isPolling, userId, config?.swrPollingInterval, dispatchEvent]);

    return { config, isPolling };
}
