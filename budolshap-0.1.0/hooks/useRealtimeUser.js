import useSWR from 'swr';
import { useEffect } from 'react';
import Pusher from 'pusher-js';
import { io } from 'socket.io-client';

const fetcher = url => fetch(url).then(r => r.json());

export function useRealtimeUser({ userId, onEvent }) {
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
                console.log(`⚡ [RealtimeUser] ${eventName} (Pusher):`, data);
                if (onEvent) onEvent(eventName, data);
            });
        });

        return () => {
            // Unbind all events from this channel
            if (channel.unbind_all) {
                channel.unbind_all();
            }
            channel.unsubscribe();
            pusher.disconnect();
        };
    }, [isPusher, userId, config, onEvent]);

    // 3. Socket.io Subscription
    useEffect(() => {
        if (!isSocket || !userId || !config?.socketUrl) return;

        const socket = io(config.socketUrl);

        socket.on('connect', () => {
            socket.emit('subscribe', `user-${userId}`);
        });

        // Socket.io doesn't have a direct "bind_all" like Pusher, 
        // but we can listen for specific known events or use a catch-all if the server supports it.
        // For now, let's list common user events.
        const userEvents = ['store-status-updated', 'order-updated', 'rating-created', 'cart-updated'];
        
        userEvents.forEach(eventName => {
            socket.on(eventName, (data) => {
                console.log(`⚡ [RealtimeUser] ${eventName} (Socket):`, data);
                if (onEvent) onEvent(eventName, data);
            });
        });

        return () => {
            socket.disconnect();
        };
    }, [isSocket, userId, config, onEvent]);

    // 4. Polling Fallback for POLLING mode
    useEffect(() => {
        if (!isPolling || !userId) return;

        // For POLLING mode, we don't have a specific "events" API yet,
        // but we can trigger a generic "cart-updated" check periodically
        // to ensure frontend stays in sync with backend cleanup.
        const interval = setInterval(() => {
            console.log('🔄 [RealtimeUser] Polling heartbeat (POLLING mode)');
            if (onEvent) {
                // We trigger a cart-updated event periodically as a fallback
                onEvent('cart-updated', { reason: 'polling_fallback' });
            }
        }, config?.swrPollingInterval || 15000);

        return () => clearInterval(interval);
    }, [isPolling, userId, config, onEvent]);

    return { config, isPolling };
}
